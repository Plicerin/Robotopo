import { Piece, Position, getColor, getBodyPart, Tray } from './types';
import { BOARD_ROWS, BOARD_COLS, SCORE_PER_PIECE } from './constants';
import { swapPieces, findMatches, removeMatched, applyGravity } from './Board';

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

// ── Reward robot part accuracy ────────────────────────────────────────────────
function workbenchWeight(board: (Piece | null)[][], tray: Tray): number {
  let weight = 0;
  const matchResult = findMatches(board);
  
  // High reward for matches that actually build the robot (same-type matches)
  for (const [type, count] of matchResult.matchedTypes) {
    const bodyPart = getBodyPart(type);
    const partColor = getColor(type);

    // Reward matching the color we've already started in that slot
    if (bodyPart === 'head' && tray.headColor === partColor) weight += 5000 * (count - 2);
    if (bodyPart === 'torso' && tray.torsoColor === partColor) weight += 5000 * (count - 2);
    if (bodyPart === 'legs' && tray.legsColor === partColor) weight += 5000 * (count - 2);

    // Extra massive reward for big matches (supercharging)
    if (count >= 5) weight += 10000;
    if (count >= 8) weight += 25000;
  }

  return weight;
}

// ── Score a board position ───────────────────────────────────────────────────
function scoreBoard(board: (Piece | null)[][], tray: Tray): number {
  const m0 = findMatches(board);
  if (m0.positions.size === 0) return -1;

  let score = 0;

  // Basic Match Score
  score += m0.positions.size * SCORE_PER_PIECE;
  
  // Workbench Strategy Score
  score += workbenchWeight(board, tray);

  return score;
}

// ── Public: best swap ─────────────────────────────────────────────────────────
export interface BestMove { a: Position; b: Position; score: number; }

export function findBestMove(board: (Piece | null)[][], tray: Tray): BestMove | null {
  let best: BestMove | null = null;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      for (const nb of neighbors(r, c)) {
        const a     = { row: r, col: c };
        const clone = cloneBoard(board);
        swapPieces(clone, a, nb);
        const score = scoreBoard(clone, tray);
        if (score > (best?.score ?? -Infinity)) best = { a, b: nb, score };
      }
    }
  }

  return best && best.score > 0 ? best : null;
}

