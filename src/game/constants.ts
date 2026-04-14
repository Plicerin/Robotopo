import { RobotColor, BodyPart, PieceType } from './types';

export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;
export const CELL_SIZE  = 68;
export const BOARD_PAD  = 8;

// ── The 5 robot colors ────────────────────────────────────────────────────────
export const ROBOT_COLORS: RobotColor[] = ['blue', 'yellow', 'green', 'magenta', 'orange'];

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
  magenta: '#AB47BC',
  orange: '#FF7043',
};

export const COLOR_DARK: Record<RobotColor, string> = {
  blue:   '#1565C0',
  yellow: '#F57F17',
  green:  '#1B5E20',
  magenta: '#4A148C',
  orange: '#BF360C',
};

export const COLOR_LIGHT: Record<RobotColor, string> = {
  blue:   '#90CAF9',
  yellow: '#FFF9C4',
  green:  '#C8E6C9',
  magenta: '#E1BEE7',
  orange: '#FFCCBC',
};

// ── Color names ───────────────────────────────────────────────────────────────
export const COLOR_NAMES: Record<RobotColor, string> = {
  blue:   'Blue',
  yellow: 'Yellow',
  green:  'Green',
  magenta: 'Magenta',
  orange: 'Orange',
};

// ── Color → attack description ────────────────────────────────────────────────
export const COLOR_ATTACK: Record<RobotColor, string> = {
  blue:   'Piercing Beam — clears a full column',
  yellow: 'Pulse Blast — clears a 3×3 area',
  green:  'Chain Virus — clears all matching colors',
  magenta: 'Gravity Well — clears from edges inward',
  orange: 'Inferno — clears an entire row',
};

// ── Scoring ───────────────────────────────────────────────────────────────────
export const SCORE_PER_PIECE = 10;
export const ROBOT_BONUS     = 500;
export const LEVEL_TARGETS   = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];

// ── Legacy piece colors (for backward compatibility in Renderer) ──────────────
export const PIECE_COLORS: Record<string, string> = {
  nut: '#FFD600',
  battery: '#FF7043',
  bolt: '#42A5F5',
  fuse: '#FFF9C4',
  chip: '#66BB6A',
  gear: '#AB47BC',
};

export const PIECE_DARK: Record<string, string> = {
  nut: '#F57F17',
  battery: '#BF360C',
  bolt: '#1565C0',
  fuse: '#FFFDE7',
  chip: '#1B5E20',
  gear: '#4A148C',
};

export const PIECE_LIGHT: Record<string, string> = {
  nut: '#FFF9C4',
  battery: '#FFCCBC',
  bolt: '#90CAF9',
  fuse: '#FFFDE7',
  chip: '#C8E6C9',
  gear: '#E1BEE7',
};

// ── Variant colors ─────────────────────────────────────────────────────────────
export const VARIANT_COLORS: Record<string, string> = {
  saw: '#FF7043',
  gatling: '#42A5F5',
  rocket: '#D32F2F',
  'default': '#42A5F5',
};
