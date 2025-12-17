import { GRID_SIZE, SECTOR_SIZE, KLINGON_MAX_HP, KLINGON_MAX_POWER, KLINGON_MIN_POWER } from '../constants';
import { QuadrantData, Entity, Position, EntityType } from '../types';

export const generateGalaxy = (): QuadrantData[][] => {
  const galaxy: QuadrantData[][] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    const row: QuadrantData[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      // Random generation logic
      const r = Math.random();
      let klingons = 0;
      if (r > 0.90) klingons = 3;
      else if (r > 0.80) klingons = 2;
      else if (r > 0.60) klingons = 1;

      let starbases = Math.random() > 0.95 ? 1 : 0;
      let stars = Math.floor(Math.random() * 8) + 1;

      row.push({
        klingons,
        starbases,
        stars,
        scanned: false,
      });
    }
    galaxy.push(row);
  }
  
  // Ensure at least one starbase and some klingons
  // A simple fix for simplicity: verify total later or just trust RNG for 8x8 grid
  return galaxy;
};

export const generateSectorMap = (quadData: QuadrantData, playerSector: Position): Entity[] => {
  const entities: Entity[] = [];
  const takenPositions = new Set<string>();
  const pKey = `${playerSector.x},${playerSector.y}`;
  takenPositions.add(pKey);

  // Add Enterprise
  entities.push({
    id: 'enterprise',
    type: EntityType.ENTERPRISE,
    x: playerSector.x,
    y: playerSector.y,
  });

  const getRandomPos = (): Position => {
    let pos: Position;
    let key: string;
    do {
      pos = {
        x: Math.floor(Math.random() * SECTOR_SIZE),
        y: Math.floor(Math.random() * SECTOR_SIZE),
      };
      key = `${pos.x},${pos.y}`;
    } while (takenPositions.has(key));
    takenPositions.add(key);
    return pos;
  };

  // Place Klingons
  for (let i = 0; i < quadData.klingons; i++) {
    const pos = getRandomPos();
    entities.push({
      id: `klingon-${i}`,
      type: EntityType.KLINGON,
      x: pos.x,
      y: pos.y,
      hp: KLINGON_MAX_HP,
    });
  }

  // Place Starbases
  for (let i = 0; i < quadData.starbases; i++) {
    const pos = getRandomPos();
    entities.push({
      id: `starbase-${i}`,
      type: EntityType.STARBASE,
      x: pos.x,
      y: pos.y,
    });
  }

  // Place Stars
  for (let i = 0; i < quadData.stars; i++) {
    const pos = getRandomPos();
    entities.push({
      id: `star-${i}`,
      type: EntityType.STAR,
      x: pos.x,
      y: pos.y,
    });
  }

  return entities;
};

export const calculateDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calculateBearing = (from: Position, to: Position): number => {
  // Returns angle in degrees (0-360), 0 being Right/East, 90 being Up/North (cartesian inverted Y)
  // But our grid is Y down (0 is top).
  // Cartesian: 0 rad = right. Math.atan2(dy, dx).
  // dx = to.x - from.x
  // dy = to.y - from.y (In grid, down is positive y, so we might want to invert for standard polar or stick to screen coords)
  // Let's stick to screen coords:
  // dx > 0 = Right, dy > 0 = Down.
  // We want standard Trek polar? Usually 0 is East, 90 North.
  // In screen: East is (1, 0), North is (0, -1).
  const dx = to.x - from.x;
  const dy = from.y - to.y; // Invert Y so 'up' is positive for calculation
  let theta = Math.atan2(dy, dx); // radians
  let degrees = theta * (180 / Math.PI);
  if (degrees < 0) degrees += 360;
  return degrees;
};

export const degreesToRadians = (deg: number) => deg * (Math.PI / 180);

export const getKlingonDamage = (): number => {
  return Math.floor(Math.random() * (KLINGON_MAX_POWER - KLINGON_MIN_POWER + 1)) + KLINGON_MIN_POWER;
};

export const formatCoordinates = (q: Position, s: Position): string => {
  // 1-based indexing for display (Quadrant 1-8, Sector 1-8)
  return `Q${q.x + 1},${q.y + 1} S${s.x + 1},${s.y + 1}`;
};