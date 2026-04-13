import { Piece, Position, isRobotPart, getBodyPart } from './types';
import { BOARD_ROWS, BOARD_COLS, SCORE_PER_PIECE, ROBOT_BONUS } from './constants';
import { swapPieces, findMatches, removeMatched, applyGravity, matchKey } from './Board';

// ── Clone ─────────────────────────────────────────────────────────────────────
function cloneBoard(src: (Piece | null)[][]): (Piece | null)[][] {
  return src.map(row => row.map(p => (p ? { ...p } : null)));
}

// ── Right + down neighbours only ──────────────────────────────────────────────
function neighbors(r: number, c: number): Position[] {
  const ns: Position[] = [];
  if (c + 1 < BOARD_COLS) ns.push({ row: r, col: c + 1 });
  if (r + 1 < BOARD_ROWS) ns.push({ row: r + 1, col: c });
  return ns;
}

// ── Reward vertical alignment of robot parts (potential combos) ──────────────
function robotAlignmentBonus(board: (Piece | null)[][]): number {
  let bonus = 0;
  for (let c = 0; c < BOARD_COLS; c++) {
    for (let r = 0; r < BOARD_ROWS - 1; r++) {
      const p1 = board[r][c];
      const p2 = board[r + 1][c];
      if (!p1 || !p2) continue;

      if (isRobotPart(p1.type) && isRobotPart(p2.type)) {
        const b1 = getBodyPart(p1.type);
        const b2 = getBodyPart(p2.type);
        // Head above Torso or Torso above Legs is a strong bonus
        if ((b1 === 'head' && b2 === 'torso') || (b1 === 'torso' && b2 === 'legs')) {
          bonus += 1500; // Increased weight for combos
        }
      }
    }
  }
  return bonus;
}

function matchCountWeight(board: (Piece | null)[][]): number {
  let weight = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (!p) continue;
      // Bonus if it's near completing a 3rd match (simple lookahead)
      const k = matchKey(p);
      if (c < BOARD_COLS - 2 && matchKey(board[r][c + 1]) === k) weight += 10;
      if (r < BOARD_ROWS - 2 && matchKey(board[r + 1][c]) === k) weight += 10;
    }
  }
  return weight;
}

// ── Score a board position (mutates board — pass a clone) ─────────────────────
function scoreBoard(board: (Piece | null)[][]): number {
  const m0 = findMatches(board);
  if (m0.positions.size === 0) return -1;

  let score = 0;

  // Pass 0
  score += m0.positions.size * SCORE_PER_PIECE;
  if (m0.has5plus)                        score += 3000;
  else if (m0.has4plusH || m0.has4plusV)  score += 1000;
  score += m0.combos.length * (ROBOT_BONUS * 2);

  // Power bonus for robot parts in matches
  for (const key of m0.positions) {
    const [r, c] = key.split(',').map(Number);
    const p = board[r][c];
    if (p && isRobotPart(p.type)) score += p.power * 200;
  }

  removeMatched(board, m0);
  applyGravity(board);

  // Cascade pass 1
  const m1 = findMatches(board);
  score += m1.positions.size * SCORE_PER_PIECE * 0.7;
  score += m1.combos.length * ROBOT_BONUS;

  if (m1.positions.size > 0) {
    removeMatched(board, m1);
    applyGravity(board);

    // Cascade pass 2
    const m2 = findMatches(board);
    score += m2.positions.size * SCORE_PER_PIECE * 0.5;
    score += m2.combos.length * (ROBOT_BONUS * 0.5);
  }

  score += robotAlignmentBonus(board);
  score += matchCountWeight(board);
  return score;
}

// ── Public: best swap ─────────────────────────────────────────────────────────
export interface BestMove { a: Position; b: Position; score: number; }

export function findBestMove(board: (Piece | null)[][]): BestMove | null {
  let best: BestMove | null = null;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      for (const nb of neighbors(r, c)) {
        const a     = { row: r, col: c };
        const clone = cloneBoard(board);
        swapPieces(clone, a, nb);
        const score = scoreBoard(clone);
        if (score > (best?.score ?? -Infinity)) best = { a, b: nb, score };
      }
    }
  }

  return best && best.score > 0 ? best : null;
}

