import React from 'react';
import { Entity, EntityType } from '../types';
import { ENTITY_ICONS, SECTOR_SIZE, COLORS } from '../constants';

interface GridProps {
  entities: Entity[];
}

export const Grid: React.FC<GridProps> = ({ entities }) => {
  // Create an 8x8 grid representation
  const rows = [];
  for (let y = 0; y < SECTOR_SIZE; y++) {
    const cells = [];
    for (let x = 0; x < SECTOR_SIZE; x++) {
      const entity = entities.find((e) => e.x === x && e.y === y);
      let content = ENTITY_ICONS.EMPTY;
      let colorClass = COLORS.MUTED;

      if (entity) {
        switch (entity.type) {
          case EntityType.ENTERPRISE:
            content = ENTITY_ICONS.ENTERPRISE;
            colorClass = 'text-blue-400 font-bold';
            break;
          case EntityType.KLINGON:
            content = ENTITY_ICONS.KLINGON;
            colorClass = 'text-red-500 font-bold animate-pulse';
            break;
          case EntityType.STARBASE:
            content = ENTITY_ICONS.STARBASE;
            colorClass = 'text-yellow-400 font-bold';
            break;
          case EntityType.STAR:
            content = ENTITY_ICONS.STAR;
            colorClass = 'text-white opacity-60';
            break;
        }
      }
      cells.push(
        <div 
          key={`${x}-${y}`} 
          className={`w-8 h-8 md:w-10 md:h-10 border border-green-900 flex items-center justify-center select-none ${colorClass}`}
        >
          {content}
        </div>
      );
    }
    rows.push(<div key={y} className="flex">{cells}</div>);
  }

  return (
    <div className={`inline-block border-2 ${COLORS.BORDER} bg-black p-1`}>
      {rows}
    </div>
  );
};