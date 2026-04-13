// ── Regular piece types ──────────────────────────────────────────────────────
export type RegularType = 'nut' | 'bolt' | 'fuse' | 'chip' | 'gear' | 'battery';

// ── Robot part variants ───────────────────────────────────────────────────────
// Heads control HOW damage is dealt
export type HeadVariant  = 'vortex' | 'hammer' | 'laser';
// Torsos control WHAT is targeted
export type TorsoVariant = 'sensor' | 'wild' | 'random';
// Legs control HOW MANY are destroyed
export type LegsVariant  = 'soldier' | 'scout' | 'titan';
// Arms add EXTRA STRIKES
export type ArmVariant   = 'saw' | 'gatling' | 'rocket';

// ── Robot part tile types (fall on the board just like regular pieces) ───────
export type RobotHeadType  = `head-${HeadVariant}`;
export type RobotTorsoType = `torso-${TorsoVariant}`;
export type RobotLegsType  = `legs-${LegsVariant}`;
export type RobotArmType   = `arm-${ArmVariant}`;

export type RobotPartType = RobotHeadType | RobotTorsoType | RobotLegsType | RobotArmType;

// ── Unified tile type for every cell on the board ────────────────────────────
export type PieceType = RegularType | RobotPartType;

// ── Robot and body-part identifiers ─────────────────────────────────────────
export type BodyPart = 'head' | 'torso' | 'legs' | 'arm';

// ── Type guards / helpers ─────────────────────────────────────────────────────
export function isRobotPart(type: PieceType): type is RobotPartType {
  return type.startsWith('head-') || type.startsWith('torso-') || type.startsWith('legs-') || type.startsWith('arm-');
}

export function getBodyPart(type: RobotPartType): BodyPart {
  if (type.startsWith('head-'))  return 'head';
  if (type.startsWith('torso-')) return 'torso';
  if (type.startsWith('legs-'))  return 'legs';
  return 'arm';
}

export function getVariant(type: RobotPartType): string {
  return type.split('-')[1];
}

// ── Robot Combo Activation ───────────────────────────────────────────────────
export type RobotSynergy = 'sensor' | 'titan' | 'vortex' | 'military' | 'industrial';

export interface RobotCombo {
  head:  HeadVariant;
  torso: TorsoVariant;
  legs:  LegsVariant;
  leftArm:  ArmVariant | null;
  rightArm: ArmVariant | null;
  synergy:  RobotSynergy | null;
  row:   number; // The row of the head piece
  col:   number; // The column of the robot (vertical stack)
  power: number; // Avg power level
}

// ── Board tile ───────────────────────────────────────────────────────────────
export interface Piece {
  id:    number;
  type:  PieceType;
  row:   number;
  col:   number;
  power: number; // 0-5: power level of the part (increments when matched as color)
}

// ── Grid coordinate ──────────────────────────────────────────────────────────
export interface Position {
  row: number;
  col: number;
}

// ── Match scan result ─────────────────────────────────────────────────────────
// Regular matches only include RegularType pieces now.
// Robot combos are handled separately in Board.ts.
export interface MatchResult {
  positions: Set<string>; // "row,col" keys
  levelUps:  Set<string>; // NEW: robot parts that should level up instead of clearing
  maxLength: number;
  has4plusH: boolean;
  has4plusV: boolean;
  has5plus:  boolean;
  combos:    RobotCombo[]; // robot combos activated this pass
}

// ── Game phase ───────────────────────────────────────────────────────────────
export type GamePhase = 'idle' | 'selected' | 'swapping' | 'resolving' | 'animating';

// ── Per-game statistics ───────────────────────────────────────────────────────
export interface GameStats {
  startTime:        number;   // Date.now() when game began
  movesAttempted:   number;   // every swap the player (or CPU) tried
  validMoves:       number;   // swaps that produced at least one match
  piecesCleared:    number;   // total tiles removed by regular matching
  matches3:         number;   // distinct 3-piece match events
  matches4:         number;   // distinct 4-piece match events
  matches5plus:     number;   // distinct 5+ match events
  bestCombo:        number;   // deepest cascade chain reached
  robotsActivated:  number;   // total robot powers triggered
  synergiesActivated: Record<RobotSynergy, number>;
  headsCollected:   Record<HeadVariant, number>;
  torsosCollected:  Record<TorsoVariant, number>;
  legsCollected:    Record<LegsVariant, number>;
  shuffles:         number;   // times the board was deadlock-shuffled
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

// ── Top-level game state (snapshot passed to React) ──────────────────────────
export interface GameState {
  board:       (Piece | null)[][];
  phase:       GamePhase;
  selected:    Position | null;
  swapping:    { a: Position; b: Position; progress: number } | null;
  falling:     { id: number; startY: number; currentY: number }[]; // Track falling pieces
  clearing:    { r: number; c: number; progress: number; type: PieceType }[]; // Track clearing pieces
  magnetizing: { r: number; c: number; targetC: number; progress: number; type: PieceType }[]; // New!
  score:       number;
  level:       number;
  targetScore: number;
  combo:       number;
  message:     string;
  stats:       GameStats;
}
