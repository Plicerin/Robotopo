// ── Robot colors (5, matching the old regular-piece palette) ─────────────────
export type RobotColor = 'blue' | 'yellow' | 'green' | 'purple' | 'orange';

// ── Body parts (3 slots per robot) ───────────────────────────────────────────
export type BodyPart = 'head' | 'torso' | 'legs';

// ── Unified tile type: every cell is a color+bodypart combination (15 total) ─
export type PieceType = `${RobotColor}-${BodyPart}`;

// ── Type helpers ─────────────────────────────────────────────────────────────
export function getColor(type: PieceType): RobotColor {
  return type.split('-')[0] as RobotColor;
}

export function getBodyPart(type: PieceType): BodyPart {
  return type.split('-')[1] as BodyPart;
}

// ── Build Tray — tracks progress toward the current robot assembly ────────────
export interface Tray {
  headColor:  RobotColor | null;
  headPower:  number;
  torsoColor: RobotColor | null;
  torsoPower: number;
  legsColor:  RobotColor | null;
  legsPower:  number;
}

// ── Board tile ───────────────────────────────────────────────────────────────
export interface Piece {
  id:    number;
  type:  PieceType;
  row:   number;
  col:   number;
  power: number; // reserved for future level-up use
}

// ── Grid coordinate ──────────────────────────────────────────────────────────
export interface Position {
  row: number;
  col: number;
}

// ── Match scan result ─────────────────────────────────────────────────────────
export interface MatchResult {
  positions:    Set<string>;    // "row,col" keys
  matchedTypes: Map<PieceType, number>; // type -> longest run found
  maxLength: number;
  has4plusH: boolean;
  has4plusV: boolean;
  has5plus:  boolean;
}

// ── Game phase ───────────────────────────────────────────────────────────────
export type GamePhase = 'idle' | 'selected' | 'swapping' | 'resolving' | 'animating' | 'assembling';

// ── Per-game statistics ───────────────────────────────────────────────────────
export interface GameStats {
  startTime:      number;
  movesAttempted: number;
  validMoves:     number;
  piecesCleared:  number;
  matches3:       number;
  matches4:       number;
  matches5plus:   number;
  bestCombo:      number;
  robotsLaunched: number;
  robotsByColor:  Record<RobotColor, number>;
  shuffles:       number;
}

// ── All-time records (persisted to localStorage) ──────────────────────────────
export interface AllTimeRecord {
  highScore:          number;
  bestCombo:          number;
  mostRobotsOneGame:  number;
  gamesPlayed:        number;
  totalPiecesCleared: number;
  totalRobots:        number;
}

export interface LogEntry {
  id: number;
  type: 'move' | 'robot';
  title: string;
  detail: string;
  timestamp: number;
}

// ── Top-level game state (snapshot passed to React) ──────────────────────────
export interface GameState {
  board:       (Piece | null)[][];
  phase:       GamePhase;
  selected:    Position | null;
  swapping:    { a: Position; b: Position; progress: number } | null;
  falling:     { id: number; startY: number; currentY: number }[];
  clearing:    { r: number; c: number; progress: number; type: PieceType }[];
  magnetizing: { r: number; c: number; targetC: number; progress: number; type: PieceType }[];
  robotAttack: { color: RobotColor; cells: { r: number; c: number }[]; progress: number } | null;
  tray:        Tray;
  score:       number;
  level:       number;
  targetScore: number;
  combo:       number;
  message:     string;
  stats:       GameStats;
  logs:        LogEntry[];
}
