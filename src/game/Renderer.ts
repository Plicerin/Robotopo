import { PieceType, Position, GameState, RobotColor, getColor, getBodyPart } from './types';
import { BOARD_ROWS, BOARD_COLS, CELL_SIZE, BOARD_PAD, COLOR_HEX, COLOR_DARK, COLOR_LIGHT } from './constants';

export const CANVAS_W = BOARD_PAD * 2 + BOARD_COLS * CELL_SIZE;
export const CANVAS_H = BOARD_PAD * 2 + BOARD_ROWS * CELL_SIZE;

// ── Image Assets ─────────────────────────────────────────────────────────────
const ROBOT_IMAGES: Record<string, HTMLImageElement> = {};
const TINT_CACHE: Map<string, HTMLCanvasElement> = new Map();

const ROBOT_ASSET_PATHS: Record<string, string> = {
  'head_blue': '/assets/blue_head.png',
  'torso_blue': '/assets/blue_torso.png',
  'legs_blue': '/assets/blue_legs.png',
};

function loadRobotImages() {
  if (typeof window === 'undefined') return;
  for (const [key, path] of Object.entries(ROBOT_ASSET_PATHS)) {
    const img = new Image();
    img.src = path;
    ROBOT_IMAGES[key] = img;
  }
}
loadRobotImages();

function getTintedImage(img: HTMLImageElement, color: string): HTMLCanvasElement | null {
  if (!img.complete || img.naturalWidth === 0) return null;
  const cacheKey = `${img.src}_${color}`;
  if (TINT_CACHE.has(cacheKey)) return TINT_CACHE.get(cacheKey)!;

  const tCanvas = document.createElement('canvas');
  tCanvas.width = img.naturalWidth;
  tCanvas.height = img.naturalHeight;
  const tCtx = tCanvas.getContext('2d')!;
  
  // Method: Soft Hue Blend (Gentler on the artwork details)
  tCtx.drawImage(img, 0, 0);
  
  // Apply the color overlay using 'hue' or 'color' mode to preserve the original lighting/shading
  tCtx.globalCompositeOperation = 'hue';
  tCtx.fillStyle = color;
  tCtx.fillRect(0, 0, tCanvas.width, tCanvas.height);
  
  // Re-apply original alpha mask to ensure clean edges
  tCtx.globalCompositeOperation = 'destination-in';
  tCtx.drawImage(img, 0, 0);
  
  TINT_CACHE.set(cacheKey, tCanvas);
  return tCanvas;
}

// ── Utility ──────────────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);   ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);   ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
  ctx.lineTo(x, y + r);       ctx.quadraticCurveTo(x, y,         x + r, y);
  ctx.closePath();
}

// ── Draw a robot part tile ────────────────────────────────────────────────────
function drawPiece(ctx: CanvasRenderingContext2D, type: PieceType, cx: number, cy: number, sz: number): void {
  const colorType = getColor(type);
  const colorValue = COLOR_HEX[colorType];
  const dark  = COLOR_DARK[colorType];
  const light = COLOR_LIGHT[colorType];
  const body  = getBodyPart(type);
  const hs    = sz * 0.46;

  // Dark tile background
  roundRect(ctx, cx - hs, cy - hs, hs * 2, hs * 2, 9);
  ctx.fillStyle = '#060d1a';
  ctx.fill();

  // Glowing border
  ctx.save();
  ctx.shadowColor = colorValue;
  ctx.shadowBlur  = 10;
  roundRect(ctx, cx - hs, cy - hs, hs * 2, hs * 2, 9);
  ctx.strokeStyle = colorValue;
  ctx.lineWidth   = 2.5;
  ctx.stroke();
  ctx.restore();

  // Colored inner fill (subtle)
  roundRect(ctx, cx - hs + 3, cy - hs + 3, (hs - 3) * 2, (hs - 3) * 2, 7);
  ctx.fillStyle = colorValue + '18';
  ctx.fill();

    // Attempt to draw high-quality asset
  const assetKey = `${body}_${colorType}`;
  let img = ROBOT_IMAGES[assetKey];
  let isTinted = false;

  if (!img) {
    img = ROBOT_IMAGES[`${body}_blue`];
    if (img) isTinted = true;
  }

  if (img && img.complete && img.naturalWidth > 0) {
    const pX = cx - sz * 0.4, pY = cy - sz * 0.4, pS = sz * 0.8;
    ctx.save();
    
    // Always use the tinting engine for all colors (including blue) 
    // to ensure visual uniformity across the board.
    const tinted = getTintedImage(img, colorValue);
    if (tinted) {
      ctx.drawImage(tinted, pX, pY, pS, pS);
    } else {
      ctx.drawImage(img, pX, pY, pS, pS);
    }
    
    ctx.restore();
    return;
  }

  // Fallback to vector icons
  switch (body) {
    case 'head':  drawHeadIcon(ctx, cx, cy, sz, colorValue, light, dark);  break;
    case 'torso': drawTorsoIcon(ctx, cx, cy, sz, colorValue, light, dark); break;
    case 'legs':  drawLegsIcon(ctx, cx, cy, sz, colorValue, light, dark);  break;
  }
}

function drawHeadIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, _dark: string): void {
  const hw = sz * 0.35, hh = sz * 0.3;
  // Antenna/Signal Bars (Monitor style)
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - hw * 0.5, cy - hh * 0.6); ctx.lineTo(cx - hw * 0.7, cy - hh * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + hw * 0.5, cy - hh * 0.6); ctx.lineTo(cx + hw * 0.7, cy - hh * 0.9); ctx.stroke();
  
  // Monitor Head (Square)
  roundRect(ctx, cx - hw, cy - hh * 0.5, hw * 2, hh, 6);
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  
  // Screen Inner
  roundRect(ctx, cx - hw * 0.85, cy - hh * 0.35, hw * 1.7, hh * 0.7, 3);
  ctx.fillStyle = '#0a0a12'; ctx.fill();
  ctx.strokeStyle = color + '66'; ctx.lineWidth = 1; ctx.stroke();

  // Face (Glow)
  ctx.shadowColor = light; ctx.shadowBlur = 4;
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.arc(cx - hw * 0.35, cy, sz * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + hw * 0.35, cy, sz * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = '#00000088';
  ctx.fillRect(cx - sz * 0.3, cy + sz * 0.18, sz * 0.6, sz * 0.12);
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.13}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('HEAD', cx, cy + sz * 0.24);
}

function drawTorsoIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, _dark: string): void {
  const tw = sz * 0.38, th = sz * 0.42;
  // Tapered Torso
  ctx.beginPath();
  ctx.moveTo(cx - tw, cy - th * 0.4);
  ctx.lineTo(cx + tw, cy - th * 0.4);
  ctx.lineTo(cx + tw * 0.6, cy + th * 0.5);
  ctx.lineTo(cx - tw * 0.6, cy + th * 0.5);
  ctx.closePath();
  
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();

  // Core Light
  ctx.beginPath(); ctx.arc(cx, cy - th * 0.05, sz * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = light; ctx.shadowColor = light; ctx.shadowBlur = 8;
  ctx.fill(); ctx.shadowBlur = 0;
  
  // Shoulder Joints
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx - tw * 0.9, cy - th * 0.3, sz * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + tw * 0.9, cy - th * 0.3, sz * 0.08, 0, Math.PI * 2); ctx.fill();

  // Label
  ctx.fillStyle = '#00000088';
  ctx.fillRect(cx - sz * 0.3, cy + sz * 0.22, sz * 0.6, sz * 0.12);
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.13}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('TORSO', cx, cy + sz * 0.28);
}

function drawLegsIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, _dark: string): void {
  const lw = sz * 0.35, lh = sz * 0.45;
  // Hydro-Legs
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - sz * 0.2, cy - lh * 0.3); ctx.lineTo(cx - sz * 0.3, cy + lh * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + sz * 0.2, cy - lh * 0.3); ctx.lineTo(cx + sz * 0.3, cy + lh * 0.1); ctx.stroke();
  
  // Knee Pistons
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx - sz * 0.3, cy + lh * 0.1, sz * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + sz * 0.3, cy + lh * 0.1, sz * 0.08, 0, Math.PI * 2); ctx.fill();
  
  // Feet
  roundRect(ctx, cx - sz * 0.42, cy + lh * 0.32, sz * 0.28, sz * 0.12, 2);
  ctx.fillStyle = color + '66'; ctx.fill(); ctx.stroke();
  roundRect(ctx, cx + sz * 0.14, cy + lh * 0.32, sz * 0.28, sz * 0.12, 2);
  ctx.fillStyle = color + '66'; ctx.fill(); ctx.stroke();

  // Label
  ctx.fillStyle = '#00000088';
  ctx.fillRect(cx - sz * 0.3, cy + sz * 0.22, sz * 0.6, sz * 0.12);
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.13}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('LEGS', cx, cy + sz * 0.28);
}

// ── OBSOLETE SHIM (kept only to satisfy lingering references during transition)
function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

function drawNut(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number): void {
  const r = sz * 0.44;
  drawHex(ctx, cx, cy, r);
  ctx.fillStyle = PIECE_COLORS.nut; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.nut; ctx.lineWidth = 2; ctx.stroke();
  drawHex(ctx, cx, cy - sz * 0.05, r * 0.5);
  ctx.fillStyle = PIECE_LIGHT.nut + '44'; ctx.fill();
  drawHex(ctx, cx, cy, r * 0.28);
  ctx.fillStyle = PIECE_DARK.nut; ctx.fill();
}

function drawBattery(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number): void {
  const bw = sz * 0.4, bh = sz * 0.6;
  // Battery body
  roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 4);
  ctx.fillStyle = PIECE_COLORS.battery; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.battery; ctx.lineWidth = 2; ctx.stroke();
  // Battery cap
  roundRect(ctx, cx - bw * 0.2, cy - bh / 2 - sz * 0.08, bw * 0.4, sz * 0.1, 1);
  ctx.fillStyle = PIECE_LIGHT.battery; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.battery; ctx.lineWidth = 1; ctx.stroke();
  // Energy level indicator
  const ew = bw * 0.6, eh = bh * 0.7;
  roundRect(ctx, cx - ew / 2, cy - eh / 2, ew, eh, 2);
  ctx.fillStyle = PIECE_DARK.battery + '88'; ctx.fill();
  // Glow bar
  roundRect(ctx, cx - ew / 2, cy + eh / 6, ew, eh / 3, 1);
  ctx.fillStyle = '#FFFFFFCC'; ctx.fill();
}

function drawBolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number): void {
  const hr = sz * 0.28;
  drawHex(ctx, cx, cy - sz * 0.15, hr);
  ctx.fillStyle = PIECE_COLORS.bolt; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.bolt; ctx.lineWidth = 1.5; ctx.stroke();
  const sw = sz * 0.18, sh = sz * 0.36;
  roundRect(ctx, cx - sw / 2, cy + sz * 0.05, sw, sh, 2);
  ctx.fillStyle = PIECE_LIGHT.bolt; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.bolt; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = PIECE_DARK.bolt; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const ty = cy + sz * 0.1 + i * (sh / 3.5);
    ctx.beginPath(); ctx.moveTo(cx - sw / 2, ty); ctx.lineTo(cx + sw / 2, ty); ctx.stroke();
  }
}

function drawFuse(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number): void {
  const bw = sz * 0.55, bh = sz * 0.22;
  roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = PIECE_COLORS.fuse; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.fuse; ctx.lineWidth = 1.5; ctx.stroke();
  roundRect(ctx, cx - bw * 0.3, cy - bh * 0.38, bw * 0.6, bh * 0.28, 2);
  ctx.fillStyle = '#FFFDE7AA'; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.fuse; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - bw / 2, cy); ctx.lineTo(cx - bw / 2 - sz * 0.14, cy - sz * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + bw / 2, cy); ctx.lineTo(cx + bw / 2 + sz * 0.14, cy - sz * 0.1); ctx.stroke();
}

function drawChip(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number): void {
  const bs = sz * 0.52;
  roundRect(ctx, cx - bs / 2, cy - bs / 2, bs, bs, 4);
  ctx.fillStyle = PIECE_COLORS.chip; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.chip; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = PIECE_LIGHT.chip + '88'; ctx.lineWidth = 1;
  [[cx - bs * 0.15, cy - bs * 0.3, cx - bs * 0.15, cy + bs * 0.3],
   [cx + bs * 0.15, cy - bs * 0.3, cx + bs * 0.15, cy + bs * 0.3],
   [cx - bs * 0.3, cy, cx + bs * 0.3, cy]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });
  ctx.beginPath(); ctx.arc(cx, cy - bs / 2, bs * 0.08, 0, Math.PI);
  ctx.fillStyle = PIECE_DARK.chip; ctx.fill();
  const pinW = sz * 0.07, pinH = sz * 0.12, pinSp = bs * 0.28;
  ctx.fillStyle = PIECE_LIGHT.chip;
  for (let i = -1; i <= 1; i++) {
    roundRect(ctx, cx - bs / 2 - pinW, cy + i * pinSp - pinH / 2, pinW, pinH, 1); ctx.fill();
    roundRect(ctx, cx + bs / 2,        cy + i * pinSp - pinH / 2, pinW, pinH, 1); ctx.fill();
  }
}

function drawGear(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number): void {
  const OR = sz * 0.44, IR = sz * 0.30, TR = sz * 0.16;
  const teeth = 8;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i * Math.PI) / teeth - Math.PI / (teeth * 2);
    const r = i % 2 === 0 ? OR : IR;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = PIECE_COLORS.gear; ctx.fill();
  ctx.strokeStyle = PIECE_DARK.gear; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, TR, 0, Math.PI * 2);
  ctx.fillStyle = PIECE_DARK.gear; ctx.fill();
  ctx.strokeStyle = PIECE_COLORS.gear; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + TR * Math.cos(a), cy + TR * Math.sin(a));
    ctx.lineTo(cx + (IR - 4) * Math.cos(a), cy + (IR - 4) * Math.sin(a));
    ctx.stroke();
  }
}

function drawRegularPiece(ctx: CanvasRenderingContext2D, type: RegularType, cx: number, cy: number, sz: number): void {
  const img = PIECE_IMAGES[type];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, cx - sz / 2, cy - sz / 2, sz, sz);
    return;
  }

  // Fallback to vector shapes if images aren't loaded
  switch (type) {
    case 'nut':     drawNut(ctx, cx, cy, sz);     break;
    case 'bolt':    drawBolt(ctx, cx, cy, sz);    break;
    case 'fuse':    drawFuse(ctx, cx, cy, sz);    break;
    case 'chip':    drawChip(ctx, cx, cy, sz);    break;
    case 'gear':    drawGear(ctx, cx, cy, sz);    break;
    case 'battery': drawBattery(ctx, cx, cy, sz); break;
  }
}

// ── Robot part tile shapes ────────────────────────────────────────────────────

function drawRobotHeadShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, variant: string): void {
  const hw = sz * 0.38, hh = sz * 0.32;
  // Antenna/Signal Bars (Monitor style)
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - hw * 0.5, cy - hh * 0.5); ctx.lineTo(cx - hw * 0.7, cy - hh * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + hw * 0.5, cy - hh * 0.5); ctx.lineTo(cx + hw * 0.7, cy - hh * 0.8); ctx.stroke();
  
  // Monitor Head (Square with rounded corners)
  roundRect(ctx, cx - hw, cy - hh * 0.5, hw * 2, hh, 8);
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  
  // Screen Inner
  roundRect(ctx, cx - hw * 0.85, cy - hh * 0.35, hw * 1.7, hh * 0.7, 4);
  ctx.fillStyle = '#0a0a12'; ctx.fill();
  ctx.strokeStyle = color + '66'; ctx.lineWidth = 1; ctx.stroke();

  // "Face" (Eyes) - Emissive monitor glow
  ctx.shadowColor = light; ctx.shadowBlur = 4;
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.arc(cx - hw * 0.35, cy, sz * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + hw * 0.35, cy, sz * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(variant.toUpperCase(), cx, cy + hh * 0.8);
}

function drawRobotTorsoShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, variant: string): void {
  const tw = sz * 0.4, th = sz * 0.45;
  // Tapered Torso (Heavy shoulders, narrow waist)
  ctx.beginPath();
  ctx.moveTo(cx - tw, cy - th * 0.4); // Top left
  ctx.lineTo(cx + tw, cy - th * 0.4); // Top right
  ctx.lineTo(cx + tw * 0.6, cy + th * 0.5); // Bottom right
  ctx.lineTo(cx - tw * 0.6, cy + th * 0.5); // Bottom left
  ctx.closePath();
  
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();

  // Core Light (Center of torso)
  ctx.beginPath();
  ctx.arc(cx, cy - th * 0.05, sz * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = light; ctx.shadowColor = light; ctx.shadowBlur = 8;
  ctx.fill(); ctx.shadowBlur = 0;
  
  // Shoulder Joints (Bulky)
  ctx.beginPath(); ctx.arc(cx - tw * 0.9, cy - th * 0.3, sz * 0.1, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(cx + tw * 0.9, cy - th * 0.3, sz * 0.1, 0, Math.PI * 2); ctx.fill();

  // Label
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(variant.toUpperCase(), cx, cy + th * 0.7);
}

function drawRobotLegsShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, variant: string): void {
  const lw = sz * 0.35, lh = sz * 0.45;
  // Hydro-Legs (Piston/Cylinder style)
  
  // Upper "Thigh" Pistons
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - sz * 0.2, cy - lh * 0.4); ctx.lineTo(cx - sz * 0.3, cy + lh * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + sz * 0.2, cy - lh * 0.4); ctx.lineTo(cx + sz * 0.3, cy + lh * 0.1); ctx.stroke();
  
  // Large Hydraulic Knees
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx - sz * 0.3, cy + lh * 0.1, sz * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + sz * 0.3, cy + lh * 0.1, sz * 0.1, 0, Math.PI * 2); ctx.fill();
  
  // Feet (Stabilizers)
  roundRect(ctx, cx - sz * 0.45, cy + lh * 0.35, sz * 0.3, sz * 0.12, 3);
  ctx.fillStyle = color + '66'; ctx.fill(); ctx.stroke();
  roundRect(ctx, cx + sz * 0.15, cy + lh * 0.35, sz * 0.3, sz * 0.12, 3);
  ctx.fillStyle = color + '66'; ctx.fill(); ctx.stroke();

  // Label
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(variant.toUpperCase(), cx, cy + lh * 0.6);
}

function drawRobotArmShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, variant: string): void {
  const aw = sz * 0.2, ah = sz * 0.3;
  // Shoulder Joint
  ctx.beginPath(); ctx.arc(cx, cy - sz * 0.2, sz * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = light; ctx.lineWidth = 1; ctx.stroke();

  // Bicep/Main Arm Bar
  roundRect(ctx, cx - aw / 2, cy - sz * 0.2, aw, ah, 4);
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();

  // Weapon Icon Area
  if (variant === 'saw') {
    // No icon for saw as requested, just the bicep arm structure
  } else if (variant === 'gatling') {
    const gw = sz * 0.05, gh = sz * 0.2, gy = cy + sz * 0.05;
    for (let i = -1; i <= 1; i++) {
        roundRect(ctx, cx + i * sz * 0.06 - gw/2, gy, gw, gh, 1);
        ctx.fillStyle = '#455A64'; ctx.fill(); 
        ctx.strokeStyle = light; ctx.lineWidth = 0.5; ctx.stroke();
    }
  } else { // Rocket pod
    roundRect(ctx, cx - sz * 0.15, cy + sz * 0.1, sz * 0.3, sz * 0.18, 2);
    ctx.fillStyle = '#D32F2F'; ctx.fill();
    ctx.strokeStyle = light; ctx.lineWidth = 1; ctx.stroke();
  }

  // Label: Variant Name (Adjusted size for Gatling)
  const isGatling = variant === 'gatling';
  ctx.fillStyle = light;
  ctx.font = `bold ${isGatling ? sz * 0.12 : sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; 
  ctx.textBaseline = 'middle';
  
  // High contrast background strip for text
  ctx.fillStyle = '#000000AA';
  ctx.fillRect(cx - sz * 0.35, cy + sz * 0.22, sz * 0.7, sz * 0.12);
  
  ctx.fillStyle = light;
  ctx.fillText(variant.toUpperCase(), cx, cy + sz * 0.28);
}

function drawRobotAndPower(ctx: CanvasRenderingContext2D, piece: any, cx: number, cy: number, sz: number) {
  drawRobotPart(ctx, piece.type as RobotPartType, cx, cy, sz);

  // Draw Power Level indicator
  if (piece.power > 1) {
    const powerLabel = piece.power >= 5 ? 'MAX' : `LV${piece.power}`;
    ctx.fillStyle = piece.power >= 5 ? '#FF5252' : '#FFD600'; // Red for MAX, Yellow for levels
    ctx.font = `bold ${sz * 0.18}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(powerLabel, cx + sz * 0.4, cy + sz * 0.4);
  }
}

function drawRobotPart(ctx: CanvasRenderingContext2D, type: RobotPartType, cx: number, cy: number, sz: number): void {
  const variant = getVariant(type);
  const body    = getBodyPart(type);
  const color   = VARIANT_COLORS[variant] || '#FFFFFF';
  const light   = '#FFFFFF';
  const hs      = sz * 0.46;

  // Dark tile background
  roundRect(ctx, cx - hs, cy - hs, hs * 2, hs * 2, 9);
  ctx.fillStyle = '#060d1a';
  ctx.fill();

  // Coloured glowing border
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = 10;
  roundRect(ctx, cx - hs, cy - hs, hs * 2, hs * 2, 9);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.stroke();
  ctx.restore();

  // Body-part icon
  switch (body) {
    case 'head':  drawRobotHeadShape(ctx, cx, cy - sz * 0.04, sz, color, light, variant);  break;
    case 'torso': drawRobotTorsoShape(ctx, cx, cy - sz * 0.02, sz, color, light, variant); break;
    case 'legs':  drawRobotLegsShape(ctx, cx, cy + sz * 0.02, sz, color, light, variant);  break;
    case 'arm':   drawRobotArmShape(ctx, cx, cy - sz * 0.02, sz, color, light, variant);  break;
  }
}

function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, _dt: number): void {
  const W = CANVAS_W, H = CANVAS_H;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0d1b2a'); bg.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grid cells
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const x = BOARD_PAD + c * CELL_SIZE, y = BOARD_PAD + r * CELL_SIZE;
      roundRect(ctx, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
      ctx.fillStyle = (r + c) % 2 === 0 ? '#162032' : '#0f1822';
      ctx.fill();
      ctx.strokeStyle = '#1e3a5f22'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  // Selection highlight
  if (state.selected) {
    const { row, col } = state.selected;
    const x = BOARD_PAD + col * CELL_SIZE, y = BOARD_PAD + row * CELL_SIZE;
    roundRect(ctx, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
    ctx.fillStyle = '#ffffff1a'; ctx.fill();
    ctx.strokeStyle = '#ffffffCC'; ctx.lineWidth = 2.5; ctx.stroke();
    const b = 4, tl = 8, br = CELL_SIZE - 8;
    ctx.strokeStyle = '#ffffffEE'; ctx.lineWidth = 2;
    [
      [x+b, y+b+tl, x+b,    y+b,    x+b+tl, y+b],
      [x+br, y+b,   x+br+b, y+b,    x+br+b, y+b+tl],
      [x+br+b, y+br, x+br+b, y+br+b, x+br, y+br+b],
      [x+b+tl, y+br+b, x+b, y+br+b, x+b, y+br],
    ].forEach(([x1,y1,x2,y2,x3,y3]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
    });
  }

  // Static pieces
  const focusColors = new Set<string>();
  if (state.tray.headColor) focusColors.add(state.tray.headColor);
  if (state.tray.torsoColor) focusColors.add(state.tray.torsoColor);
  if (state.tray.legsColor) focusColors.add(state.tray.legsColor);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;
      if (state.swapping && (
        (r === state.swapping.a.row && c === state.swapping.a.col) ||
        (r === state.swapping.b.row && c === state.swapping.b.col)
      )) continue;
      if (state.falling.some(f => f.id === piece.id)) continue;

      const x = BOARD_PAD + c * CELL_SIZE, y = BOARD_PAD + r * CELL_SIZE;
      const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2;
      const sz = CELL_SIZE - 10;
      ctx.save();
      
      // Ghosting: Dim mismatched robot parts
      const isRobotPart = piece.type.includes('_');
      if (focusColors.size > 0 && isRobotPart) {
        const variant = getVariant(piece.type as RobotPartType);
        const partColor = VARIANT_COLORS[variant];
        if (partColor && !focusColors.has(partColor)) {
          ctx.globalAlpha = 0.35;
        }
      }

      if (state.selected?.row === r && state.selected?.col === c) {
        ctx.translate(cx, cy); ctx.scale(1.07, 1.07); ctx.translate(-cx, -cy);
      }
      drawPiece(ctx, piece.type, cx, cy, sz);
      ctx.restore();
    }
  }

  // Clearing animation
  for (const cl of state.clearing) {
    const x = BOARD_PAD + cl.c * CELL_SIZE, y = BOARD_PAD + cl.r * CELL_SIZE;
    const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2;
    const scale = 1 - cl.progress;
    ctx.save();
    ctx.globalAlpha = 1 - cl.progress;
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
    drawPiece(ctx, cl.type, cx, cy, CELL_SIZE - 10);
    ctx.restore();
  }

  // Falling animation
  for (const f of state.falling) {
    const piece = state.board.flat().find(p => p?.id === f.id);
    if (!piece) continue;
    const cx = BOARD_PAD + piece.col * CELL_SIZE + CELL_SIZE / 2;
    const cy = BOARD_PAD + f.currentY + CELL_SIZE / 2;
    ctx.save();
    drawPiece(ctx, piece.type, cx, cy, CELL_SIZE - 10);
    ctx.restore();
  }

  // Swap animation
  if (state.swapping) {
    const { a, b, progress } = state.swapping;
    const pA = state.board[a.row][a.col];
    const pB = state.board[b.row][b.col];
    const xA = BOARD_PAD + a.col * CELL_SIZE, yA = BOARD_PAD + a.row * CELL_SIZE;
    const xB = BOARD_PAD + b.col * CELL_SIZE, yB = BOARD_PAD + b.row * CELL_SIZE;
    const sz = CELL_SIZE - 10;
    if (pA) { ctx.save(); drawPiece(ctx, pA.type, xA + (xB-xA)*progress + CELL_SIZE/2, yA + (yB-yA)*progress + CELL_SIZE/2, sz); ctx.restore(); }
    if (pB) { ctx.save(); drawPiece(ctx, pB.type, xB + (xA-xB)*progress + CELL_SIZE/2, yB + (yA-yB)*progress + CELL_SIZE/2, sz); ctx.restore(); }
  }

  // Robot attack animation
  if (state.robotAttack) {
    const { color, cells, progress } = state.robotAttack;
    const hex = COLOR_HEX[color as RobotColor];
    const chargePhase = Math.min(1, progress / 0.55);        // 0→1 over first 55%
    const burstPhase  = Math.max(0, (progress - 0.55) / 0.45); // 0→1 over last 45%

    // Per-cell highlight
    for (const { r, c } of cells) {
      const x = BOARD_PAD + c * CELL_SIZE, y = BOARD_PAD + r * CELL_SIZE;
      const cx2 = x + CELL_SIZE / 2, cy2 = y + CELL_SIZE / 2;
      ctx.save();
      if (burstPhase > 0) {
        const scale = 1 + burstPhase * 0.9;
        ctx.globalAlpha = 1 - burstPhase;
        ctx.translate(cx2, cy2); ctx.scale(scale, scale); ctx.translate(-cx2, -cy2);
      } else {
        ctx.globalAlpha = 0.35 + chargePhase * 0.65;
      }
      roundRect(ctx, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
      ctx.fillStyle = hex + '99';
      ctx.fill();
      ctx.shadowColor = hex; ctx.shadowBlur = 18 * chargePhase;
      roundRect(ctx, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
      ctx.strokeStyle = hex; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }

    // Color-specific signature overlay
    ctx.save();
    const overlayAlpha = burstPhase > 0 ? 1 - burstPhase : chargePhase;

    switch (color as RobotColor) {
      case 'orange': {
        // Horizontal fire sweep across target row(s)
        const rows = Array.from(new Set(cells.map(c => c.r)));
        const totalW = BOARD_COLS * CELL_SIZE;

        ctx.globalAlpha = overlayAlpha;
        ctx.shadowColor = hex;
        ctx.shadowBlur = rows.length > 2 ? 40 : 20;

        for (const row of rows) {
          const ry = BOARD_PAD + row * CELL_SIZE;
          const grad = ctx.createLinearGradient(BOARD_PAD, 0, BOARD_PAD + totalW, 0);
          
          grad.addColorStop(0, hex + '00');
          grad.addColorStop(Math.max(0, Math.min(1, chargePhase - 0.15)), hex + '00');
          grad.addColorStop(Math.max(0, Math.min(1, chargePhase)), hex + 'CC');
          grad.addColorStop(Math.max(0, Math.min(1, chargePhase + 0.15)), hex + '00');
          grad.addColorStop(1, hex + '00');

          ctx.fillStyle = grad;
          const thickness = rows.length > 1 ? 0.9 : 0.7;
          ctx.fillRect(BOARD_PAD, ry + (CELL_SIZE * (1-thickness)/2), totalW, CELL_SIZE * thickness);
        }
        break;
      }
      case 'blue': {
        // Vertical laser beam down the target column(s)
        const cols = Array.from(new Set(cells.map(c => c.c)));
        const totalH = BOARD_ROWS * CELL_SIZE;

        ctx.globalAlpha = overlayAlpha;
        ctx.shadowColor = hex; 
        ctx.shadowBlur = cols.length > 2 ? 50 : 30;

        for (const col of cols) {
          const cx3 = BOARD_PAD + col * CELL_SIZE;
          const grad = ctx.createLinearGradient(0, BOARD_PAD, 0, BOARD_PAD + totalH);
          
          const stop1 = 0;
          const stop2 = Math.max(0, Math.min(1, chargePhase - 0.15));
          const stop3 = Math.max(0, Math.min(1, chargePhase));
          const stop4 = Math.max(0, Math.min(1, chargePhase + 0.15));
          const stop5 = 1;

          grad.addColorStop(stop1, hex + '00');
          grad.addColorStop(stop2, hex + '00');
          grad.addColorStop(stop3, hex + 'EE');
          grad.addColorStop(stop4, hex + '00');
          grad.addColorStop(stop5, hex + '00');
          
          ctx.fillStyle = grad;
          const thickness = cols.length > 1 ? 0.8 : 0.5;
          ctx.fillRect(cx3 + CELL_SIZE * (1 - thickness)/2, BOARD_PAD, CELL_SIZE * thickness, totalH);
        }
        break;
      }
      case 'yellow': {
        // Expanding shockwave ring from board center
        const ocx = BOARD_PAD + (BOARD_COLS / 2) * CELL_SIZE;
        const ocy = BOARD_PAD + (BOARD_ROWS / 2) * CELL_SIZE;
        const maxR = Math.hypot(BOARD_COLS, BOARD_ROWS) * CELL_SIZE * 0.55;
        const radius = chargePhase * maxR;
        ctx.globalAlpha = overlayAlpha;
        ctx.shadowColor = hex; ctx.shadowBlur = 25;
        ctx.strokeStyle = hex; ctx.lineWidth = 6 - chargePhase * 3;
        ctx.beginPath(); ctx.arc(ocx, ocy, Math.max(1, radius), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = overlayAlpha * 0.45;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ocx, ocy, Math.max(1, radius * 0.6), 0, Math.PI * 2); ctx.stroke();
        break;
      }
      case 'green': {
        // Crawling dashed lines connecting infected cells
        if (cells.length > 1) {
          ctx.globalAlpha = overlayAlpha * 0.8;
          ctx.strokeStyle = hex; ctx.shadowColor = hex; ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -chargePhase * 24;
          for (let i = 0; i < cells.length - 1; i++) {
            const ax = BOARD_PAD + cells[i].c * CELL_SIZE + CELL_SIZE / 2;
            const ay = BOARD_PAD + cells[i].r * CELL_SIZE + CELL_SIZE / 2;
            const bx = BOARD_PAD + cells[i + 1].c * CELL_SIZE + CELL_SIZE / 2;
            const by = BOARD_PAD + cells[i + 1].r * CELL_SIZE + CELL_SIZE / 2;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          }
          ctx.setLineDash([]);
        }
        break;
      }
      case 'purple': {
        // Gravity Well — Swirling vortex in center + lines pulling from edges
        const pcx = BOARD_PAD + (BOARD_COLS / 2) * CELL_SIZE;
        const pcy = BOARD_PAD + (BOARD_ROWS / 2) * CELL_SIZE;
        
        // 1. Swirling Vortex in Center
        ctx.save();
        ctx.translate(pcx, pcy);
        ctx.rotate(chargePhase * Math.PI * 4); // Multiple rotations
        ctx.shadowColor = hex; ctx.shadowBlur = 20 + 20 * chargePhase;
        ctx.strokeStyle = hex;
        
        for (let i = 0; i < 3; i++) {
          const r = Math.max(0.1, (20 + i * 15) * chargePhase);
          ctx.lineWidth = 4 - i;
          ctx.globalAlpha = overlayAlpha * (0.8 - i * 0.2);
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.6, (i * Math.PI) / 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Converging Attraction Lines
        ctx.strokeStyle = hex; ctx.shadowColor = hex; ctx.shadowBlur = 8; ctx.lineWidth = 2;
        for (const cell of cells) {
          const ax = BOARD_PAD + cell.c * CELL_SIZE + CELL_SIZE / 2;
          const ay = BOARD_PAD + cell.r * CELL_SIZE + CELL_SIZE / 2;
          
          // Pieces "vibrate" and then zip to center
          const jitter = (1 - chargePhase) * 3 * Math.sin(Date.now() / 20);
          const tx = ax + (pcx - ax) * Math.pow(chargePhase, 2);
          const ty = ay + (pcy - ay) * Math.pow(chargePhase, 2);
          
          ctx.globalAlpha = overlayAlpha * 0.6;
          ctx.beginPath(); 
          ctx.moveTo(ax + jitter, ay + jitter); 
          ctx.lineTo(tx, ty); 
          ctx.stroke();

          // Particle at the end of the line
          ctx.fillStyle = hex;
          ctx.globalAlpha = overlayAlpha;
          ctx.beginPath();
          ctx.arc(tx, ty, 3 * (1 - chargePhase), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
    }
    ctx.restore();
  }

  // Flash message
  if (state.message) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    const boxH = 40;
    ctx.fillRect(0, H - boxH, W, boxH);
    ctx.fillStyle = '#00F2FF';
    ctx.fillRect(0, H - boxH, W, 2);
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.message, W / 2, H - boxH / 2 + 1);
    ctx.restore();
  }
}

// ── Pixel → cell coordinate ───────────────────────────────────────────────────
export function pixelToCell(px: number, py: number): Position | null {
  const col = Math.floor((px - BOARD_PAD) / CELL_SIZE);
  const row = Math.floor((py - BOARD_PAD) / CELL_SIZE);
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
  return { row, col };
}

export function render(canvas: HTMLCanvasElement, state: GameState, dt: number = 0): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawBoard(ctx, state, dt);
}

