import { Piece, PieceType, RegularType, RobotPartType, Position, GameState, isRobotPart, getBodyPart, getVariant } from './types';
import {
  BOARD_ROWS, BOARD_COLS, CELL_SIZE, BOARD_PAD,
  PIECE_COLORS, PIECE_DARK, PIECE_LIGHT,
  VARIANT_COLORS,
} from './constants';

export const CANVAS_W = BOARD_PAD * 2 + BOARD_COLS * CELL_SIZE;
export const CANVAS_H = BOARD_PAD * 2 + BOARD_ROWS * CELL_SIZE;

// ── Image Assets ─────────────────────────────────────────────────────────────
const PIECE_IMAGES: Partial<Record<RegularType, HTMLImageElement>> = {};
const IMAGE_SOURCES: Partial<Record<RegularType, string>> = {
  battery: '/battery.png',
  bolt: '/bolt.png',
  chip: '/chip.png',
  fuse: '/fuse.png',
  gear: '/gear.png',
};

// Preload images
if (typeof window !== 'undefined') {
  Object.entries(IMAGE_SOURCES).forEach(([type, src]) => {
    const img = new Image();
    img.src = src;
    PIECE_IMAGES[type as RegularType] = img;
  });
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

// ── Regular piece shapes ─────────────────────────────────────────────────────

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
  const hw = sz * 0.34, hh = sz * 0.28;
  // Antenna
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - sz * 0.22); ctx.lineTo(cx, cy - sz * 0.36); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy - sz * 0.38, sz * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = light; ctx.fill();
  // Head outline
  roundRect(ctx, cx - hw, cy - sz * 0.2, hw * 2, hh, 5);
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Eyes
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.arc(cx - hw * 0.38, cy - sz * 0.1, sz * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + hw * 0.38, cy - sz * 0.1, sz * 0.06, 0, Math.PI * 2); ctx.fill();
  // Mouth grille
  roundRect(ctx, cx - hw * 0.55, cy + sz * 0.01, hw * 1.1, sz * 0.08, 2);
  ctx.fillStyle = color + '77'; ctx.fill();
  // Label
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  
  // High contrast background strip for text
  ctx.fillStyle = '#00000088';
  ctx.fillRect(cx - sz * 0.35, cy + sz * 0.14, sz * 0.7, sz * 0.12);

  ctx.fillStyle = light;
  const isRandom = variant === 'random';
  const label = isRandom ? 'BATT' : variant.toUpperCase();
  ctx.fillText(label, cx, cy + sz * 0.20);
}

function drawRobotTorsoShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, variant: string): void {
  const tw = sz * 0.38, th = sz * 0.34;
  // Body
  roundRect(ctx, cx - tw, cy - sz * 0.22, tw * 2, th, 4);
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Chest panel
  roundRect(ctx, cx - tw * 0.5, cy - sz * 0.14, tw, sz * 0.16, 2);
  ctx.strokeStyle = light + '99'; ctx.lineWidth = 1; ctx.stroke();
  // Core light
  ctx.beginPath(); ctx.arc(cx, cy - sz * 0.05, sz * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = light; ctx.fill();
  // Arm stubs
  const aw = sz * 0.12, ah = sz * 0.22;
  roundRect(ctx, cx - tw - aw, cy - sz * 0.18, aw, ah, 2);
  ctx.fillStyle = color + '55'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
  roundRect(ctx, cx + tw,       cy - sz * 0.18, aw, ah, 2);
  ctx.fillStyle = color + '55'; ctx.fill(); ctx.stroke();
  // Label
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // High contrast background strip for text
  ctx.fillStyle = '#00000088';
  ctx.fillRect(cx - sz * 0.3, cy + sz * 0.34, sz * 0.6, sz * 0.12);

  ctx.fillStyle = light;
  ctx.fillText(variant.toUpperCase(), cx, cy + sz * 0.40);
}

function drawRobotLegsShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string, light: string, variant: string): void {
  // Hip
  roundRect(ctx, cx - sz * 0.3, cy - sz * 0.28, sz * 0.6, sz * 0.12, 3);
  ctx.fillStyle = color + '33'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Left leg
  roundRect(ctx, cx - sz * 0.3, cy - sz * 0.14, sz * 0.24, sz * 0.34, 3);
  ctx.fillStyle = color + '33'; ctx.fill(); ctx.stroke();
  // Right leg
  roundRect(ctx, cx + sz * 0.06, cy - sz * 0.14, sz * 0.24, sz * 0.34, 3);
  ctx.fillStyle = color + '33'; ctx.fill(); ctx.stroke();
  // Feet
  roundRect(ctx, cx - sz * 0.34, cy + sz * 0.21, sz * 0.3, sz * 0.09, 2);
  ctx.fillStyle = color + '55'; ctx.fill(); ctx.stroke();
  roundRect(ctx, cx + sz * 0.04, cy + sz * 0.21, sz * 0.3, sz * 0.09, 2);
  ctx.fillStyle = color + '55'; ctx.fill(); ctx.stroke();
  // Knee dots
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.arc(cx - sz * 0.18, cy + sz * 0.02, sz * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + sz * 0.18, cy + sz * 0.02, sz * 0.04, 0, Math.PI * 2); ctx.fill();
  // Label
  ctx.fillStyle = light; ctx.font = `bold ${sz * 0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // High contrast background strip for text
  ctx.fillStyle = '#00000088';
  ctx.fillRect(cx - sz * 0.3, cy + sz * 0.22, sz * 0.6, sz * 0.12);

  ctx.fillStyle = light;
  ctx.fillText(variant.toUpperCase(), cx, cy + sz * 0.28);
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

function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, dt: number): void {
  const W = CANVAS_W, H = CANVAS_H;

  // Background
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
    // Corner ticks
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

  // Pieces
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;

      // Skip rendering if this piece is part of a swap or other animation
      if (state.swapping && (
        (r === state.swapping.a.row && c === state.swapping.a.col) ||
        (r === state.swapping.b.row && c === state.swapping.b.col)
      )) continue;

      if (state.falling.some(f => f.id === piece.id)) continue;
      
      // FIX FLICKER: Don't skip rendering if the piece is in state.clearing.
      // Instead, we skip it ONLY if it is in magnetizing (handled below)
      // or swapping. The state.clearing items are rendered on TOP in the loop anyway.
      if (state.magnetizing.some(m => m.r === r && m.c === c)) continue;

      const x  = BOARD_PAD + c * CELL_SIZE, y = BOARD_PAD + r * CELL_SIZE;
      const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2;
      const sz = CELL_SIZE - 10;
      const isSelected = state.selected?.row === r && state.selected?.col === c;

      ctx.save();
      if (isSelected) {
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 18;
        ctx.translate(cx, cy); ctx.scale(1.07, 1.07); ctx.translate(-cx, -cy);
      } else if (!isRobotPart(piece.type)) {
        ctx.shadowColor = PIECE_DARK[piece.type as RegularType] + '88';
        ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      }

      if (isRobotPart(piece.type)) {
        drawRobotAndPower(ctx, piece, cx, cy, sz);
      } else {
        drawRegularPiece(ctx, piece.type as RegularType, cx, cy, sz);
      }
      ctx.restore();
    }
  }

  // Clearing Animation
  for (const cl of state.clearing) {
    const x  = BOARD_PAD + cl.c * CELL_SIZE, y = BOARD_PAD + cl.r * CELL_SIZE;
    const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2;
    const scale = 1 - cl.progress;
    
    ctx.save();
    ctx.globalAlpha = 1 - cl.progress;
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
    if (isRobotPart(cl.type)) drawRobotAndPower(ctx, { type: cl.type, power: 1 } as Piece, cx, cy, CELL_SIZE - 10);
    else drawRegularPiece(ctx, cl.type as RegularType, cx, cy, CELL_SIZE - 10);
    ctx.restore();
  }

  // Falling Animation
  for (const f of state.falling) {
    const piece = state.board.flat().find(p => p?.id === f.id);
    if (!piece) continue;
    const cx = BOARD_PAD + piece.col * CELL_SIZE + CELL_SIZE / 2;
    const cy = BOARD_PAD + f.currentY + CELL_SIZE / 2;
    const sz = CELL_SIZE - 10;

    ctx.save();
    if (isRobotPart(piece.type)) drawRobotAndPower(ctx, piece, cx, cy, sz);
    else drawRegularPiece(ctx, piece.type as RegularType, cx, cy, sz);
    ctx.restore();
  }

  // Swap Animation
  if (state.swapping) {
    const { a, b, progress } = state.swapping;
    const pA = state.board[a.row][a.col];
    const pB = state.board[b.row][b.col];

    const xA = BOARD_PAD + a.col * CELL_SIZE, yA = BOARD_PAD + a.row * CELL_SIZE;
    const xB = BOARD_PAD + b.col * CELL_SIZE, yB = BOARD_PAD + b.row * CELL_SIZE;

    // Interpolate positions
    const curXA = xA + (xB - xA) * progress;
    const curYA = yA + (yB - yA) * progress;
    const curXB = xB + (xA - xB) * progress;
    const curYB = yB + (yA - yB) * progress;

    const sz = CELL_SIZE - 10;

    // Draw A
    if (pA) {
      ctx.save();
      const cx = curXA + CELL_SIZE / 2, cy = curYA + CELL_SIZE / 2;
      if (isRobotPart(pA.type)) drawRobotAndPower(ctx, pA, cx, cy, sz);
      else drawRegularPiece(ctx, pA.type as RegularType, cx, cy, sz);
      ctx.restore();
    }
    // Draw B
    if (pB) {
      ctx.save();
      const cx = curXB + CELL_SIZE / 2, cy = curYB + CELL_SIZE / 2;
      if (isRobotPart(pB.type)) drawRobotAndPower(ctx, pB, cx, cy, sz);
      else drawRegularPiece(ctx, pB.type as RegularType, cx, cy, sz);
      ctx.restore();
    }
  }

  // Magnet Animation
  for (const m of state.magnetizing) {
    const startX = BOARD_PAD + m.c * CELL_SIZE + CELL_SIZE / 2;
    const targetX = BOARD_PAD + m.targetC * CELL_SIZE + CELL_SIZE / 2;
    const curX = startX + (targetX - startX) * m.progress;
    const cy = BOARD_PAD + m.r * CELL_SIZE + CELL_SIZE / 2;
    const sz = CELL_SIZE - 10;

    ctx.save();
    
    // ⚡ ENHANCED ELECTRIC ARC / ZAP EFFECT ⚡
    if (m.progress > 0 && m.progress < 1) {
      const segments = 12; // More jagged segments
      const arcWidth = 2 + Math.random() * 3; // Thicker arc
      
      // Draw multiple layers of the arc for "cranked up" look
      for (const layer of [{clr: '#00F2FF', blur: 30, lw: arcWidth}, {clr: '#FFFFFF', blur: 5, lw: 1.5}]) {
        ctx.beginPath();
        ctx.moveTo(startX, cy);
        
        ctx.shadowBlur = layer.blur;
        ctx.shadowColor = layer.clr;
        ctx.strokeStyle = layer.clr;
        ctx.lineWidth = layer.lw;

        for (let i = 1; i <= segments; i++) {
          const segX = startX + (curX - startX) * (i / segments);
          // High intensity jitter
          const volt = (Math.random() - 0.5) * (25 * (1 - m.progress) + 5); 
          ctx.lineTo(segX, cy + volt);
        }
        ctx.stroke();
      }

      // Large particle sparks and energy flares
      for (let i = 0; i < 6; i++) {
        const sx = curX + (Math.random() - 0.5) * 40;
        const sy = cy + (Math.random() - 0.5) * 40;
        const flareSize = 2 + Math.random() * 4;
        ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#00F2FF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00F2FF';
        ctx.fillRect(sx - flareSize/2, sy - flareSize/2, flareSize, flareSize);
      }
    }

    // Draw the sliding piece (slightly larger/shaking if being magnetised)
    const shake = (Math.random() - 0.5) * 4;
    if (isRobotPart(m.type)) {
      drawRobotAndPower(ctx, { type: m.type, power: 1 } as Piece, curX + shake, cy + shake, sz + 2);
    } else {
      drawRegularPiece(ctx, m.type as RegularType, curX + shake, cy + shake, sz + 2);
    }
    ctx.restore();
  }

  // Flash message
  if (state.message) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    // Draw box at the very bottom of the canvas
    const boxH = 40;
    ctx.fillRect(0, H - boxH, W, boxH);
    
    // Aesthetic accent line at the top of the message bar
    ctx.fillStyle = '#00F2FF';
    ctx.fillRect(0, H - boxH, W, 2);

    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    // Center text in the bottom bar
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

// Ensure the render function is exported as expected
export function render(canvas: HTMLCanvasElement, state: GameState, dt: number = 0): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawBoard(ctx, state, dt);
}
