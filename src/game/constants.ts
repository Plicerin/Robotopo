import { RobotColor, BodyPart, PieceType } from './types';

export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;
export const CELL_SIZE  = 68;
export const BOARD_PAD  = 8;

// ── The 5 robot colors ────────────────────────────────────────────────────────
export const ROBOT_COLORS: RobotColor[] = ['blue', 'yellow', 'green', 'purple', 'orange'];

// ── The 3 body parts ─────────────────────────────────────────────────────────
export const BODY_PARTS: BodyPart[] = ['head', 'torso', 'legs'];

// ── All 15 tile types on the board ────────────────────────────────────────────
export const ALL_PIECE_TYPES: PieceType[] = ROBOT_COLORS.flatMap(
  c => BODY_PARTS.map(b => `${c}-${b}` as PieceType)
);

// ── Color visuals ─────────────────────────────────────────────────────────────
export const COLOR_HEX: Record<RobotColor, string> = {
  blue:   '#42A5F5',
  yellow: '#FFD600',
  green:  '#66BB6A',
  purple: '#AB47BC',
  orange: '#FF7043',
};

export const COLOR_DARK: Record<RobotColor, string> = {
  blue:   '#1565C0',
  yellow: '#F57F17',
  green:  '#1B5E20',
  purple: '#4A148C',
  orange: '#BF360C',
};

export const COLOR_LIGHT: Record<RobotColor, string> = {
  blue:   '#90CAF9',
  yellow: '#FFF9C4',
  green:  '#C8E6C9',
  purple: '#E1BEE7',
  orange: '#FFCCBC',
};

// ── Color names ───────────────────────────────────────────────────────────────
export const COLOR_NAMES: Record<RobotColor, string> = {
  blue:   'Blue',
  yellow: 'Yellow',
  green:  'Green',
  purple: 'Purple',
  orange: 'Orange',
};

// ── Color → attack description ────────────────────────────────────────────────
export const COLOR_ATTACK: Record<RobotColor, string> = {
  blue:   'Piercing Beam — clears a full column',
  yellow: 'Pulse Blast — clears a 3×3 area',
  green:  'Chain Virus — clears all matching colors',
  purple: 'Gravity Well — clears from edges inward',
  orange: 'Inferno — clears an entire row',
};

// ── Scoring ───────────────────────────────────────────────────────────────────
export const SCORE_PER_PIECE = 10;
export const ROBOT_BONUS     = 500;
export const LEVEL_TARGETS   = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];
