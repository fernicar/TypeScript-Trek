export const GRID_SIZE = 8;
export const SECTOR_SIZE = 8;

export const INITIAL_ENERGY = 3000;
export const INITIAL_TORPEDOES = 10;
export const INITIAL_STARDATE = 3100;
export const TIME_LIMIT = 30; // Days

export const WARP_ENERGY_COST = 10; // Per sector distance
export const MOVE_TIME_COST = 0.1; // Stardates per sector
export const PHASER_EFFICIENCY = 1.0; // Damage per energy unit (degrades with distance)
export const SHIELD_DRAIN_PER_HIT = 50;

export const KLINGON_MAX_HP = 200;
export const KLINGON_MIN_POWER = 50;
export const KLINGON_MAX_POWER = 250;

export const ENTITY_ICONS = {
  EMPTY: ' . ',
  ENTERPRISE: '-E-',
  KLINGON: '+K+',
  STARBASE: '>B<',
  STAR: ' * ',
};

export const COLORS = {
  PRIMARY: 'text-green-400',
  WARNING: 'text-amber-400',
  DANGER: 'text-red-500',
  MUTED: 'text-gray-500',
  BORDER: 'border-green-800',
  BG_TERM: 'bg-black',
};