import {
  Piece, PieceType, RegularType, RobotPartType, RobotCombo, RobotSynergy,
  HeadVariant, TorsoVariant, LegsVariant, ArmVariant,
  Position, MatchResult,
  isRobotPart, getBodyPart, getVariant,
} from './types';
import {
  BOARD_ROWS, BOARD_COLS, REGULAR_TYPES, ROBOT_PART_TYPES, ROBOT_PART_SPAWN_RATE,
} from './constants';

// ── Piece ID counter ─────────────────────────────────────────────────────────
let _nextId = 1;
function nextId(): number { return _nextId++; }

// ── Random type helpers ───────────────────────────────────────────────────────
function randomRegularType(): RegularType {
  return REGULAR_TYPES[Math.floor(Math.random() * REGULAR_TYPES.length)];
}

function randomRobotPartType(): RobotPartType {
  // Weighted spawning: Epic < Rare < Common
  const weightedParts: { t: RobotPartType; w: number }[] = [
    // COMMON (Weight: 5)
    { t: 'head-hammer',  w: 5 },
    { t: 'torso-random', w: 5 },
    { t: 'legs-soldier', w: 5 },

    // RARE (Weight: 2)
    { t: 'head-laser',   w: 2 },
    { t: 'torso-sensor', w: 2 },
    { t: 'legs-scout',   w: 2 },

    // EPIC (Weight: 1)
    { t: 'head-vortex',  w: 1 },
    { t: 'torso-wild',   w: 1 },
    { t: 'legs-titan',   w: 1 },
    { t: 'arm-rocket',   w: 1 },

    // ARMS (Weight: 3)
    { t: 'arm-saw',      w: 3 },
    { t: 'arm-gatling',  w: 3 },
  ];

  const totalWeight = weightedParts.reduce((sum, p) => sum + p.w, 0);
  let rnd = Math.random() * totalWeight;
  
  for (const part of weightedParts) {
    if (rnd < part.w) return part.t;
    rnd -= part.w;
  }
  return weightedParts[0].t;
}

function randomTileType(): PieceType {
  return Math.random() < ROBOT_PART_SPAWN_RATE ? randomRobotPartType() : randomRegularType();
}
function makePiece(type: PieceType, row: number, col: number): Piece {
  return { id: nextId(), type, row, col, power: 1 };
}

// ── Piece Matching color mapping ─────────────────────────────────────────────
export const PART_TO_COLOR: Record<RobotPartType, RegularType> = {
  'head-vortex':  'battery',  // Orange
  'head-hammer':  'bolt',     // Blue
  'head-laser':   'fuse',     // Yellow
  'torso-sensor': 'chip',     // Green
  'torso-wild':   'gear',     // Purple
  'torso-random': 'battery',  // Orange (shared)
  'legs-soldier': 'bolt',     // Blue (shared)
  'legs-scout':   'fuse',     // Yellow (shared)
  'legs-titan':   'chip',     // Green (shared)
  'arm-saw':      'gear',     // Purple
  'arm-gatling':  'battery',  // Orange
  'arm-rocket':   'bolt',     // Blue
};

// ── Match key: pieces can match with their own type or their assigned color ──
export function matchKey(p: Piece | null): string | null {
  if (!p) return null;
  // Robot parts can match with regular pieces of their color, 
  // OR with other robot parts of the EXACT same type.
  if (isRobotPart(p.type)) return (PART_TO_COLOR as any)[p.type] || p.type;
  return p.type;
}

// ── Magnet Mechanic: Move parts into cleared columns ─────────────────────────
export interface MagnetMove {
  r: number;
  c: number;
  targetR: number;
  targetC: number;
  piece: Piece;
}

export function getMagnetMoves(board: (Piece | null)[][], result: MatchResult): MagnetMove[] {
  // Only trigger on 4-matches or better
  if (!result.has4plusH && !result.has4plusV && !result.has5plus) return [];

  const magnetColors = new Set<string>();
  const magnetHoles = new Set<string>(); // Tracks (r,c) where a 4+ match occurred

  // 1. Identify "Magnet Centers" (where 4+ matches happened)
  for (const posKey of result.positions) {
    const [r, c] = posKey.split(',').map(Number);
    const p = board[r][c];
    if (p) {
      const mk = matchKey(p);
      if (mk) magnetColors.add(mk);
      if (isRobotPart(p.type)) magnetColors.add(p.type);
      magnetHoles.add(posKey);
    }
  }

  // Also include colors/types from levelUps (even if they don't leave holes)
  for (const posKey of result.levelUps) {
    const [r, c] = posKey.split(',').map(Number);
    const p = board[r][c];
    if (p) {
       const mk = matchKey(p);
       if (mk) magnetColors.add(mk);
       if (isRobotPart(p.type)) magnetColors.add(p.type);
    }
  }

  const moves: MagnetMove[] = [];
  const occupiedTargets = new Set<string>();

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      
      const isPart = piece && isRobotPart(piece.type);
      const posKey = `${r},${c}`;
      if (isPart && !result.positions.has(posKey) && !result.levelUps.has(posKey)) {
        const color = matchKey(piece);
        const exactType = piece.type;
        
        if (magnetColors.has(color!) || magnetColors.has(exactType)) {
          let bestTargetR = -1;
          let bestTargetC = -1;
          let minDist = 999;

          // RESTRICTED TO SAME ROW: Only move horizontally to fill holes
          // This avoids the "teleporting everywhere" look and keeps the board predictable.
          for (let tc = 0; tc < BOARD_COLS; tc++) {
            const targetKey = `${r},${tc}`;
            if (magnetHoles.has(targetKey) && !occupiedTargets.has(targetKey)) {
              const dist = Math.abs(tc - c);
              if (dist < minDist) {
                minDist = dist;
                bestTargetR = r;
                bestTargetC = tc;
              }
            }
          }

          if (bestTargetR !== -1) {
            moves.push({ r, c, targetR: bestTargetR, targetC: bestTargetC, piece });
            occupiedTargets.add(`${bestTargetR},${bestTargetC}`);
          }
        }
      }
    }
  }

  return moves;
}

// ── Magnet Mechanic: Apply shifts ───────────────────────────────────────────
export function applyMagnetPull(board: (Piece | null)[][], result: MatchResult, providedMoves?: MagnetMove[]): boolean {
  const moves = providedMoves || getMagnetMoves(board, result);
  if (moves.length === 0) return false;

  for (const move of moves) {
    const { r, c, targetR, targetC } = move;
    
    // Safety check: is the target actually empty/matched?
    const targetPiece = board[targetR][targetC];
    const isActuallyEmpty = !targetPiece || result.positions.has(`${targetR},${targetC}`);
    
    if (!isActuallyEmpty) {
      continue;
    }

    const piece = board[r][c]; 
    if (piece) {
        board[targetR][targetC] = piece;
        piece.row = targetR;
        piece.col = targetC;
        board[r][c] = null;
    }
  }

  return true;
}

// ── Prevent 3-in-a-row at init (regular pieces only) ─────────────────────────
function wouldMatch(board: (Piece | null)[][], row: number, col: number, type: RegularType): boolean {
  if (col >= 2 && board[row][col - 1]?.type === type && board[row][col - 2]?.type === type) return true;
  if (row >= 2 && board[row - 1]?.[col]?.type === type && board[row - 2]?.[col]?.type === type) return true;
  return false;
}

// ── Build a fresh board ───────────────────────────────────────────────────────
export function initBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
    new Array<Piece | null>(BOARD_COLS).fill(null)
  );
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (Math.random() < ROBOT_PART_SPAWN_RATE) {
        board[r][c] = makePiece(randomRobotPartType(), r, c);
      } else {
        let type: RegularType;
        let attempts = 0;
        do { type = randomRegularType(); attempts++; }
        while (attempts < 20 && wouldMatch(board, r, c, type));
        board[r][c] = makePiece(type, r, c);
      }
    }
  }
  // Clear any accidental initial matches involving robot parts
  let safety = 0;
  while (findMatches(board).positions.size > 0 && safety++ < 30) {
    const result = findMatches(board);
    for (const key of result.positions) {
      const [r, c] = key.split(',').map(Number);
      board[r][c] = makePiece(randomRegularType(), r, c);
    }
  }
  return board;
}

// ── Swap two cells ────────────────────────────────────────────────────────────
export function swapPieces(board: (Piece | null)[][], a: Position, b: Position): void {
  const pa = board[a.row][a.col];
  const pb = board[b.row][b.col];
  board[a.row][a.col] = pb;
  board[b.row][b.col] = pa;
  if (pa) { pa.row = b.row; pa.col = b.col; }
  if (pb) { pb.row = a.row; pb.col = a.col; }
}

// ── Adjacency check ───────────────────────────────────────────────────────────
export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

// ── Find Robot Combos (Head above Torso above Legs) ──────────────────────────
export function findRobotCombos(board: (Piece | null)[][]): RobotCombo[] {
  const combos: RobotCombo[] = [];
  for (let c = 0; c < BOARD_COLS; c++) {
    for (let r = 0; r < BOARD_ROWS - 2; r++) {
      const p1 = board[r][c];
      const p2 = board[r + 1][c];
      const p3 = board[r + 2][c];

      if (p1 && p2 && p3 &&
          isRobotPart(p1.type) && getBodyPart(p1.type) === 'head' &&
          isRobotPart(p2.type) && getBodyPart(p2.type) === 'torso' &&
          isRobotPart(p3.type) && getBodyPart(p3.type) === 'legs') {
        
        // Scan for ARMS (to the left and right of the TORSO)
        let leftArm: ArmVariant | null = null;
        let rightArm: ArmVariant | null = null;
        let armPower = 0;
        let armCount = 0;

        // Check Left
        if (c > 0) {
          const lp = board[r + 1][c - 1]; // Torso is at r+1
          if (lp && isRobotPart(lp.type) && getBodyPart(lp.type) === 'arm') {
            leftArm = getVariant(lp.type as RobotPartType) as ArmVariant;
            armPower += lp.power;
            armCount++;
          }
        }
        // Check Right
        if (c < BOARD_COLS - 1) {
          const rp = board[r + 1][c + 1];
          if (rp && isRobotPart(rp.type) && getBodyPart(rp.type) === 'arm') {
            rightArm = getVariant(rp.type as RobotPartType) as ArmVariant;
            armPower += rp.power;
            armCount++;
          }
        }

        const head  = getVariant(p1.type as RobotPartType) as HeadVariant;
        const torso = getVariant(p2.type as RobotPartType) as TorsoVariant;
        const legs  = getVariant(p3.type as RobotPartType) as LegsVariant;

        // Synergy logic
        let synergy: RobotSynergy | null = null;
        if (head === 'laser' && torso === 'sensor' && legs === 'scout') synergy = 'sensor';
        else if (head === 'hammer' && torso === 'random' && legs === 'titan') synergy = 'titan';
        else if (head === 'vortex' && torso === 'wild' && legs === 'soldier') synergy = 'vortex';
        else if (leftArm === 'gatling' && rightArm === 'gatling') synergy = 'military';
        else if (leftArm === 'saw' && rightArm === 'saw') synergy = 'industrial';

        combos.push({
          head,
          torso,
          legs,
          leftArm,
          rightArm,
          synergy,
          row:   r,
          col:   c,
          power: Math.round((p1.power + p2.power + p3.power + armPower) / (3 + armCount))
        });
      }
    }
  }
  return combos;
}

// ── Find all 3+ matches (Includes Robot parts as colors) ──────────────────────
export function findMatches(board: (Piece | null)[][]): MatchResult {
  const positions = new Set<string>();
  const levelUps  = new Set<string>();
  const combos = findRobotCombos(board);
  let maxLength = 0, has4plusH = false, has4plusV = false, has5plus = false;

  // Process robot combos as sets of pieces to level up instead of clearing
  for (const combo of combos) {
    const coords = [
      { r: combo.row,     c: combo.col },
      { r: combo.row + 1, c: combo.col },
      { r: combo.row + 2, c: combo.col }
    ];
    if (combo.leftArm)  coords.push({ r: combo.row + 1, c: combo.col - 1 });
    if (combo.rightArm) coords.push({ r: combo.row + 1, c: combo.col + 1 });

    for (const { r, c } of coords) {
      const p = board[r][c];
      if (p && isRobotPart(p.type)) {
        if (p.power >= 5) {
          positions.add(`${r},${c}`);
        } else {
          levelUps.add(`${r},${c}`);
        }
      }
    }
  }

  function record(r: number, c: number, len: number): void {
    const pieza = board[r][c];
    const posKey = `${r},${c}`;
    
    if (pieza && isRobotPart(pieza.type)) {
      if (pieza.power >= 5) {
         positions.add(posKey);
         levelUps.delete(posKey); // Ensure it's not marked for levelUp if it's being cleared
      } else {
         // Only level up if it's NOT already marked for removal by another match (e.g. a combo)
         if (!positions.has(posKey)) {
           levelUps.add(posKey);
         }
      }
    } else {
      positions.add(posKey);
      levelUps.delete(posKey); // If a regular piece is here, it MUST be removed
    }

    if (len >= 5) {
      has5plus = true;
    } else if (len >= 4) {
      // Correctly track if THIS specific match is 4+
      // Setting both generic flags to true since record() doesn't know direction,
      // and we want the Magnet to fire.
      has4plusH = true;
      has4plusV = true;
    }
    
    if (len > maxLength) maxLength = len;
  }

  // Horizontal (Regular types)
  for (let r = 0; r < BOARD_ROWS; r++) {
    let c = 0;
    while (c < BOARD_COLS) {
      const p = board[r][c];
      const k = matchKey(p);
      if (!k) { c++; continue; }
      
      let end = c + 1;
      while (end < BOARD_COLS) {
        const nextP = board[r][end];
        const nextK = matchKey(nextP);
        
        // Match if: 
        // 1. Keys match (Color-to-Color, or Color-to-RobotPartColor)
        // 2. OR both are Robot Parts and have the EXACT same type
        const keysMatch = (nextK === k);
        const typesMatch = (p && nextP && isRobotPart(p.type) && p.type === nextP.type);
        
        if (keysMatch || typesMatch) {
          end++;
        } else {
          break;
        }
      }

      const len = end - c;
      if (len >= 3) {
        for (let i = c; i < end; i++) record(r, i, len);
        if (len >= 5) {
          has5plus = true;
        } else if (len >= 4) {
          has4plusH = true;
        }
      }
      c = end;
    }
  }

  // Vertical (Regular types)
  for (let c = 0; c < BOARD_COLS; c++) {
    let r = 0;
    while (r < BOARD_ROWS) {
      const p = board[r][c];
      const k = matchKey(p);
      if (!k) { r++; continue; }

      let end = r + 1;
      while (end < BOARD_ROWS) {
        const nextP = board[end][c];
        const nextK = matchKey(nextP);

        const keysMatch = (nextK === k);
        const typesMatch = (p && nextP && isRobotPart(p.type) && p.type === nextP.type);

        if (keysMatch || typesMatch) {
          end++;
        } else {
          break;
        }
      }

      const len = end - r;
      if (len >= 3) {
        for (let i = r; i < end; i++) record(i, c, len);
        if (len >= 5) {
          has5plus = true;
        } else if (len >= 4) {
          has4plusV = true;
        }
      }
      r = end;
    }
  }

  return { positions, levelUps, maxLength, has4plusH, has4plusV, has5plus, combos };
}

// ── Remove matched tiles: Logic to either clear pieces or level them up ──────
export function removeMatched(board: (Piece | null)[][], result: MatchResult): void {
  // 1. Process Level Ups
  for (const key of result.levelUps) {
    const [r, c] = key.split(',').map(Number);
    const piece = board[r][c];
    if (piece && isRobotPart(piece.type) && piece.power < 5) {
      piece.power++;
    }
  }

  // 2. Process Removals
  for (const key of result.positions) {
    const [r, c] = key.split(',').map(Number);
    board[r][c] = null;
  }
}

// ── Gravity ───────────────────────────────────────────────────────────────────
export function applyGravity(board: (Piece | null)[][]): void {
  for (let c = 0; c < BOARD_COLS; c++) {
    const stack: Piece[] = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (board[r][c]) stack.push(board[r][c]!);
    }
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      const idx = (BOARD_ROWS - 1) - r;
      if (idx < stack.length) {
        const p = stack[idx];
        p.row = r;
        board[r][c] = p;
      } else {
        board[r][c] = null;
      }
    }
  }
}

// ── Fill empty cells ──────────────────────────────────────────────────────────
export function fillEmpty(board: (Piece | null)[][]): void {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (!board[r][c]) board[r][c] = makePiece(randomTileType(), r, c);
    }
  }
}

// ── Deadlock detection ────────────────────────────────────────────────────────
export function hasValidMoves(board: (Piece | null)[][]): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const neighbors: Position[] = [];
      if (c + 1 < BOARD_COLS) neighbors.push({ row: r, col: c + 1 });
      if (r + 1 < BOARD_ROWS) neighbors.push({ row: r + 1, col: c });
      for (const nb of neighbors) {
        swapPieces(board, { row: r, col: c }, nb);
        const found = findMatches(board).positions.size > 0;
        swapPieces(board, { row: r, col: c }, nb);
        if (found) return true;
      }
    }
  }
  return false;
}

export function shuffleBoard(board: (Piece | null)[][]): void {
  let attempts = 0;
  do {
    for (let r = 0; r < BOARD_ROWS; r++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (board[r][c]) board[r][c]!.type = randomTileType();
    attempts++;
  } while (!hasValidMoves(board) && attempts < 30);
}

// ── Robot power effects ───────────────────────────────────────────────────────

export function applyComboRobotPower(board: (Piece | null)[][], combo: RobotCombo): void {
  let targets: Position[] = [];
  
  // Power Multiplier (Levels 1-5)
  const powerMult = 1 + (combo.power - 1) * 0.5; // Level 1=1x, Level 2=1.5x, Level 5=3x

  // 1. Determine TARGET TYPE (Torso)
  let targetType: RegularType | 'random' = 'random';
  if (combo.torso === 'sensor') {
    // Collect specific type (least frequent piece to make it "smart")
    const counts: Record<string, number> = {};
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const p = board[r][c];
        if (p && !isRobotPart(p.type)) {
          const t = p.type as string;
          counts[t] = (counts[t] ?? 0) + 1;
        }
      }
    }
    let min = Infinity;
    targetType = REGULAR_TYPES[0];
    for (const t of REGULAR_TYPES) {
      const c = counts[t] ?? 0;
      if (c < min) { min = c; targetType = t; }
    }
  } else if (combo.torso === 'wild') {
    // Buffed Wild Torso: Max frequent piece + explosive discharge
    const counts: Record<string, number> = {};
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const p = board[r][c];
        if (p && !isRobotPart(p.type)) {
          const t = p.type as string;
          counts[t] = (counts[t] ?? 0) + 1;
        }
      }
    }
    
    let max = -1;
    targetType = REGULAR_TYPES[0];
    for (const t of REGULAR_TYPES) {
      const c = counts[t] ?? 0;
      if (c > max) { max = c; targetType = t; }
    }

    // WILD BUFF: Clear immediate neighborhood 3x3 before main beam
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = combo.row + dr + 1; // Center on Torso row (row+1)
        const nc = combo.col + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          const piece = board[nr][nc];
          if (piece && !isRobotPart(piece.type)) {
            board[nr][nc] = null;
          }
        }
      }
    }
  }

  // 2. Determine WHAT TO DESTROY (Head pattern + Legs count)
  let limit = Math.round(8 * powerMult);
  if (combo.legs === 'scout') limit = Math.round(16 * powerMult);
  if (combo.legs === 'titan') limit = Math.round(64 * powerMult);

  // Apply Synergy Buffs to limit/power
  if (combo.synergy === 'sensor') limit *= 2;
  if (combo.synergy === 'titan') limit = 64; // Titan set always clears max
  if (combo.synergy === 'military') limit += 10;
  if (combo.synergy === 'industrial') limit += 5;

  const potentialPositions: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r++)
    for (let c = 0; c < BOARD_COLS; c++)
      if (board[r][c] && !isRobotPart(board[r][c]!.type)) {
        if (targetType === 'random' || board[r][c]!.type === targetType) {
          potentialPositions.push({ row: r, col: c });
        }
      }

  // Sorting/Patten logic based on Head
  if (combo.head === 'laser') {
    // Prefers rows/cols near activation
    potentialPositions.sort((a,b) => (Math.abs(a.row - combo.row) + Math.abs(a.col - combo.col)) - (Math.abs(b.row - combo.row) + Math.abs(b.col - combo.col)));
  } else if (combo.head === 'hammer') {
    // Centered area
    potentialPositions.sort((a,b) => {
      const distA = Math.hypot(a.row - combo.row, a.col - combo.col);
      const distB = Math.hypot(b.row - combo.row, b.col - combo.col);
      return distA - distB;
    });
  } else {
    // Vortex / Random scatter
    for (let i = potentialPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [potentialPositions[i], potentialPositions[j]] = [potentialPositions[j], potentialPositions[i]];
    }
  }

  const toDestroy = potentialPositions.slice(0, limit);
  for (const pos of toDestroy) {
    board[pos.row][pos.col] = null;
  }

  // 3. ARM SUPER ATTACK - If arms are present, fire extra strikes
  const armLimit = Math.round(4 * powerMult);
  if (combo.leftArm || combo.rightArm) {
    // Collect remaining non-robot parts
    const remaining: Position[] = [];
    for (let r = 0; r < BOARD_ROWS; r++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (board[r][c] && !isRobotPart(board[r][c]!.type)) remaining.push({ row: r, col: c });

    // Left Arm Strike
    if (combo.leftArm) {
      const strikes = combo.leftArm === 'rocket' ? armLimit * 2 : armLimit;
      for (let i = 0; i < strikes && remaining.length > 0; i++) {
        const idx = Math.floor(Math.random() * remaining.length);
        const p = remaining.splice(idx, 1)[0];
        board[p.row][p.col] = null;
      }
    }
    // Right Arm Strike
    if (combo.rightArm) {
      const strikes = combo.rightArm === 'rocket' ? armLimit * 2 : armLimit;
      for (let i = 0; i < strikes && remaining.length > 0; i++) {
        const idx = Math.floor(Math.random() * remaining.length);
        const p = remaining.splice(idx, 1)[0];
        board[p.row][p.col] = null;
      }
    }
    // SUPER ATTACK: Both Arms - Clear all of a second random type
    if (combo.leftArm && combo.rightArm) {
      const otherTypes = REGULAR_TYPES.filter(t => t !== targetType);
      const superTarget = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      for (let r = 0; r < BOARD_ROWS; r++)
        for (let c = 0; c < BOARD_COLS; c++) {
          const p = board[r][c];
          if (p && p.type === superTarget) board[r][c] = null;
        }
    }
  }
}
