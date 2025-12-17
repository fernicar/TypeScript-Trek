export enum EntityType {
  EMPTY = 0,
  ENTERPRISE = 1,
  KLINGON = 2,
  STARBASE = 3,
  STAR = 4,
}

export interface Position {
  x: number;
  y: number;
}

export interface QuadrantData {
  klingons: number;
  starbases: number;
  stars: number;
  scanned: boolean; // For LRS memory
}

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  hp?: number; // For Klingons
  shield?: number; // For Klingons
}

export interface Player {
  quadrant: Position;
  sector: Position;
  energy: number;
  shields: number;
  maxEnergy: number;
  torpedoes: number;
  alive: boolean;
  docked: boolean;
}

export interface GameState {
  stardate: number;
  maxTime: number;
  galaxy: QuadrantData[][];
  currentSectorMap: Entity[];
  player: Player;
  messages: string[];
  alertLevel: 'GREEN' | 'YELLOW' | 'RED';
  totalKlingons: number;
  gameOver: boolean;
  win: boolean;
}

export enum GameCommand {
  SRS = 'SRS',
  LRS = 'LRS',
  WARP = 'WARP',
  PHASERS = 'PHASERS',
  TORPEDO = 'TORPEDO',
  SHIELDS = 'SHIELDS',
  COMPUTER = 'COMPUTER',
}