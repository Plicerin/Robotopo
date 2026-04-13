import { RegularType, RobotPartType, HeadVariant, TorsoVariant, LegsVariant, ArmVariant } from './types';

export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;
export const CELL_SIZE  = 68;
export const BOARD_PAD  = 8;

// ── Regular piece types (5 types keeps matches frequent) ─────────────────────
export const REGULAR_TYPES: RegularType[] = ['bolt', 'fuse', 'chip', 'gear', 'battery'];

// ── Robot part variants ───────────────────────────────────────────────────────
export const HEAD_VARIANTS: HeadVariant[]   = ['vortex', 'hammer', 'laser'];
export const TORSO_VARIANTS: TorsoVariant[] = ['sensor', 'wild', 'random'];
export const LEGS_VARIANTS: LegsVariant[]   = ['soldier', 'scout', 'titan'];
export const ARM_VARIANTS: ArmVariant[]     = ['saw', 'gatling', 'rocket'];

// ── Robot part tile types ─────────────────────────────────────────────────────
export const ROBOT_PART_TYPES: RobotPartType[] = [
  'head-vortex', 'head-hammer', 'head-laser',
  'torso-sensor', 'torso-wild', 'torso-random',
  'legs-soldier', 'legs-scout', 'legs-titan',
  'arm-saw', 'arm-gatling', 'arm-rocket',
];

// Probability that a newly-spawned tile is a robot part (vs. a regular piece)
// Lower = fewer board blockers = easier to find 3-matches
export const ROBOT_PART_SPAWN_RATE = 0.12; // Reduced from 0.18 to 0.12 to prevent board flooding

// ── Regular piece visuals ─────────────────────────────────────────────────────
export const PIECE_COLORS: Record<RegularType, string> = {
  nut:     '#9E9E9E',
  bolt:    '#42A5F5',
  fuse:    '#FFD600',
  chip:    '#66BB6A',
  gear:    '#AB47BC',
  battery: '#FF7043',
};
export const PIECE_DARK: Record<RegularType, string> = {
  nut:     '#424242',
  bolt:    '#1565C0',
  fuse:    '#F57F17',
  chip:    '#1B5E20',
  gear:    '#4A148C',
  battery: '#BF360C',
};
export const PIECE_LIGHT: Record<RegularType, string> = {
  nut:     '#E0E0E0',
  bolt:    '#90CAF9',
  fuse:    '#FFF9C4',
  chip:    '#C8E6C9',
  gear:    '#E1BEE7',
  battery: '#FFCCBC',
};

// ── Variant Visuals ──────────────────────────────────────────────────────────
export const VARIANT_COLORS: Record<string, string> = {
  // Matches PIECE_COLORS exactly based on PART_TO_COLOR mapping in Board.ts
  vortex:  '#FF7043', // battery (Orange)
  hammer:  '#42A5F5', // bolt (Blue)
  laser:   '#FFD600', // fuse (Yellow)
  
  sensor:  '#66BB6A', // chip (Green)
  wild:    '#AB47BC', // gear (Purple)
  random:  '#FF7043', // battery (Orange) - shared
  
  soldier: '#42A5F5', // bolt (Blue) - shared
  scout:   '#FFD600', // fuse (Yellow) - shared
  titan:   '#66BB6A', // chip (Green) - shared

  saw:     '#AB47BC', // gear (Purple)
  gatling: '#FF7043', // battery (Orange)
  rocket:  '#42A5F5', // bolt (Blue)
};

export const VARIANT_NAMES: Record<string, string> = {
  vortex:  'Vortex',
  hammer:  'Hammer',
  laser:   'Laser',
  sensor:  'Sensor',
  wild:    'Wild',
  random:  'Random',
  soldier: 'Soldier',
  scout:   'Scout',
  titan:   'Titan',
  saw:     'Saw',
  gatling: 'Gatling',
  rocket:  'Rocket',
};

export const VARIANT_DESCRIPTIONS: Record<string, string> = {
  vortex:  'Deals damage in a scattered spiral pattern',
  hammer:  'Deals heavy damage in a concentrated area',
  laser:   'Deals piercing damage in straight lines',
  sensor:  'Targets a specific type of piece',
  wild:    'Targets the most common piece on the board',
  random:  'Targets pieces completely at random',
  soldier: 'Clears a moderate number of pieces',
  scout:   'Clears a large number of pieces',
  titan:   'Clears an massive amount of pieces',
  saw:     'Fires a quick extra strike',
  gatling: 'Fires a rapid extra strike',
  rocket:  'Fires a double-power extra strike',
};

// ── Scoring ───────────────────────────────────────────────────────────────────
export const SCORE_PER_PIECE   = 10;
export const ROBOT_BONUS       = 500; // Increased for fulfilling a combo
export const LEVEL_TARGETS     = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];
