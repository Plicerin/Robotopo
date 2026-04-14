import { Piece, PieceType, RobotColor, Position, MatchResult, getColor, getBodyPart } from './types';
import { BOARD_ROWS, BOARD_COLS, ALL_PIECE_TYPES, ROBOT_COLORS } from './constants';

// ── Piece ID counter ─────────────────────────────────────────────────────────
let _nextId = 1;
function nextId(): number { return _nextId++; }

// ── Random type helpers ───────────────────────────────────────────────────────
function randomTileType(): PieceType {
  return ALL_PIECE_TYPES[Math.floor(Math.random() * ALL_PIECE_TYPES.length)];
}

function makePiece(type: PieceType, row: number, col: number): Piece {
  return { id: nextId(), type, row, col, power: 1 };
}

// ── Prevent 3-in-a-row at init ────────────────────────────────────────────────
function wouldMatch(board: (Piece | null)[][], row: number, col: number, type: PieceType): boolean {
  const typeColor = getColor(type);
  const colorOf = (r: number, c: number): RobotColor | null =>
    board[r]?.[c] ? getColor(board[r][c]!.type) : null;
  
  // Horizontal color check
  if (col >= 2 && colorOf(row, col - 1) === typeColor && colorOf(row, col - 2) === typeColor) return true;
  // Vertical color check
  if (row >= 2 && colorOf(row - 1, col) === typeColor && colorOf(row - 2, col) === typeColor) return true;
  
  return false;
}

// ── Build a fresh board ───────────────────────────────────────────────────────
export function initBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
    new Array<Piece | null>(BOARD_COLS).fill(null)
  );
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      let type: PieceType;
      let attempts = 0;
      do { type = randomTileType(); attempts++; }
      while (attempts < 20 && wouldMatch(board, r, c, type));
      board[r][c] = makePiece(type, r, c);
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

// ── Find all 3+ color matches ─────────────────────────────────────────────────
export function findMatches(board: (Piece | null)[][]): MatchResult {
  const positions    = new Set<string>();
  const matchedTypes = new Map<PieceType, number>();
  let maxLength = 0, has4plusH = false, has4plusV = false, has5plus = false;

  // Records cleared positions. If every tile in the run shares the same type, also grant tray credit.
  function record(keys: string[], len: number, isH: boolean, runType: PieceType | null): void {
    for (const k of keys) positions.add(k);
    if (runType !== null) {
      const current = matchedTypes.get(runType) || 0;
      if (len > current) matchedTypes.set(runType, len);
    }
    if (len > maxLength) maxLength = len;
    if (len >= 5) { has5plus = true; has4plusH = true; has4plusV = true; }
    else if (len >= 4) { if (isH) has4plusH = true; else has4plusV = true; }
  }

  // Horizontal — match on color, credit type only when whole run is identical type
  for (let r = 0; r < BOARD_ROWS; r++) {
    let c = 0;
    while (c < BOARD_COLS) {
      const p = board[r][c];
      if (!p) { c++; continue; }
      const color = getColor(p.type);
      let end = c + 1;
      while (end < BOARD_COLS && board[r][end] && getColor(board[r][end]!.type) === color) end++;
      const len = end - c;
      if (len >= 3) {
        const keys: string[] = [];
        for (let i = c; i < end; i++) keys.push(`${r},${i}`);
        
        // Exact-type credit: Find runs of 3+ identical PIECES within this color match
        let subStart = c;
        while (subStart < end) {
          const subType = board[r][subStart]!.type;
          let subEnd = subStart + 1;
          while (subEnd < end && board[r][subEnd]!.type === subType) subEnd++;
          const subLen = subEnd - subStart;
          if (subLen >= 3) {
            record([], subLen, true, subType);
          }
          subStart = subEnd;
        }

        record(keys, len, true, null);
      }
      c = end;
    }
  }

  // Vertical — same logic
  for (let c = 0; c < BOARD_COLS; c++) {
    let r = 0;
    while (r < BOARD_ROWS) {
      const p = board[r][c];
      if (!p) { r++; continue; }
      const color = getColor(p.type);
      let end = r + 1;
      while (end < BOARD_ROWS && board[end][c] && getColor(board[end][c]!.type) === color) end++;
      const len = end - r;
      if (len >= 3) {
        const keys: string[] = [];
        for (let i = r; i < end; i++) keys.push(`${i},${c}`);

        // Exact-type credit: Find runs of 3+ identical PIECES within this color match
        let subStart = r;
        while (subStart < end) {
          const subType = board[subStart][c]!.type;
          let subEnd = subStart + 1;
          while (subEnd < end && board[subEnd][c]!.type === subType) subEnd++;
          const subLen = subEnd - subStart;
          if (subLen >= 3) {
            record([], subLen, false, subType);
          }
          subStart = subEnd;
        }

        record(keys, len, false, null);
      }
      r = end;
    }
  }

  return { positions, matchedTypes, maxLength, has4plusH, has4plusV, has5plus };
}

// ── Remove matched tiles ───────────────────────────────────────────────────────
export function removeMatched(board: (Piece | null)[][], result: MatchResult): void {
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
      if (idx < stack.length) { const p = stack[idx]; p.row = r; board[r][c] = p; }
      else board[r][c] = null;
    }
  }
}

// ── Fill empty cells ──────────────────────────────────────────────────────────
export function fillEmpty(board: (Piece | null)[][]): void {
  for (let r = 0; r < BOARD_ROWS; r++)
    for (let c = 0; c < BOARD_COLS; c++)
      if (!board[r][c]) board[r][c] = makePiece(randomTileType(), r, c);
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

// ── Robot attack effects (fired when tray completes) ─────────────────────────

/** Compute which cells a robot attack will hit WITHOUT modifying the board. */
export function computeRobotAttack(board: (Piece | null)[][], color: RobotColor, power: number = 3): { r: number; c: number }[] {
  const keys = new Set<string>();
  // Ultimate robots (power > 5 due to 2x bonus) get a massive count boost
  const count = power > 5 ? Math.max(3, power - 3) : Math.max(1, power - 2); 

  switch (color) {
    case 'orange': {
      // Inferno — clear 'count' most populated rows
      const rowCounts: { r: number; val: number }[] = [];
      for (let r = 0; r < BOARD_ROWS; r++) rowCounts.push({ r, val: board[r].filter(Boolean).length });
      rowCounts.sort((a, b) => b.val - a.val);
      for (let i = 0; i < Math.min(count, rowCounts.length); i++) {
        const row = rowCounts[i].r;
        for (let c = 0; c < BOARD_COLS; c++) { if (board[row][c]) keys.add(`${row},${c}`); }
      }
      break;
    }
    case 'blue': {
      // Piercing Beam — clear 'count' most populated columns
      const colCounts: { c: number; val: number }[] = [];
      for (let c = 0; c < BOARD_COLS; c++) colCounts.push({ c, val: board.filter(r => r[c]).length });
      colCounts.sort((a, b) => b.val - a.val);
      for (let i = 0; i < Math.min(count, colCounts.length); i++) {
        const col = colCounts[i].c;
        for (let r = 0; r < BOARD_ROWS; r++) { if (board[r][col]) keys.add(`${r},${col}`); }
      }
      break;
    }
    case 'yellow': {
      // Pulse Blast — area grows with power
      // Ultimate yellow (power > 5) covers almost the whole board
      // Find the center of the BOARD, not just the logical grid center
      const cr = Math.floor(BOARD_ROWS / 2), cc = Math.floor(BOARD_COLS / 2);
      const rad = power > 5 ? Math.max(5, power - 1) : Math.floor((count + 1) / 2); 
      
      for (let dr = -rad; dr <= rad; dr++)
        for (let dc = -rad; dc <= rad; dc++) {
          const r = cr + dr, c = cc + dc;
          if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS && board[r][c]) keys.add(`${r},${c}`);
        }
      break;
    }
    case 'green': {
      // Chain Virus — clears 'count' most common colors
      const counts: Partial<Record<RobotColor, number>> = {};
      for (let r = 0; r < BOARD_ROWS; r++)
        for (let c = 0; c < BOARD_COLS; c++) {
          const p = board[r][c];
          if (p) { const col = getColor(p.type); counts[col] = (counts[col] ?? 0) + 1; }
        }
      const sortedCols = ROBOT_COLORS
        .filter(c => c !== 'green')
        .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
      
      const targets = sortedCols.slice(0, count);
      for (let r = 0; r < BOARD_ROWS; r++)
        for (let c = 0; c < BOARD_COLS; c++) {
          const p = board[r][c];
          if (p && targets.includes(getColor(p.type) as any)) keys.add(`${r},${c}`);
        }
      break;
    }
    case 'magenta': {
      // Gravity Well — clears pieces farthest from center (pulls inward)
      const cr = (BOARD_ROWS - 1) / 2, cc = (BOARD_COLS - 1) / 2;
      const pieces: { r: number; c: number; dist: number }[] = [];
      for (let r = 0; r < BOARD_ROWS; r++)
        for (let c = 0; c < BOARD_COLS; c++)
          if (board[r][c]) pieces.push({ r, c, dist: Math.abs(r - cr) + Math.abs(c - cc) });
      pieces.sort((a, b) => b.dist - a.dist);
      const toRemove = Math.min(15 + (count - 1) * 8, pieces.length);
      for (let i = 0; i < toRemove; i++) keys.add(`${pieces[i].r},${pieces[i].c}`);
      break;
    }
  }

  return Array.from(keys).map(k => { const [r, c] = k.split(',').map(Number); return { r, c }; });
}

/** Clear cells previously computed by computeRobotAttack. Returns cleared-position set. */
export function clearAttackCells(board: (Piece | null)[][], cells: { r: number; c: number }[]): Set<string> {
  const cleared = new Set<string>();
  for (const { r, c } of cells) {
    if (board[r][c]) { board[r][c] = null; cleared.add(`${r},${c}`); }
  }
  return cleared;
}

export function applyRobotAttack(board: (Piece | null)[][], color: RobotColor, power: number = 3): Set<string> {
  const cells = computeRobotAttack(board, color, power);
  return clearAttackCells(board, cells);
}

