import React from 'react';
import { Player } from '../types';
import { COLORS } from '../constants';

interface StatusProps {
  player: Player;
  stardate: number;
  alertLevel: string;
  klingonsLeft: number;
}

export const StatusDisplay: React.FC<StatusProps> = ({ player, stardate, alertLevel, klingonsLeft }) => {
  const getAlertColor = () => {
    switch(alertLevel) {
        case 'RED': return 'text-red-500 animate-pulse';
        case 'YELLOW': return 'text-yellow-400';
        default: return 'text-green-500';
    }
  };

  const Bar = ({ value, max, color }: { value: number, max: number, color: string }) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
        <div className="w-full h-2 bg-gray-900 border border-gray-700 mt-1">
            <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
        </div>
    );
  };

  return (
    <div className={`border ${COLORS.BORDER} p-4 bg-black font-mono text-sm grid grid-cols-2 md:grid-cols-4 gap-4`}>
        <div>
            <div className="text-gray-500 text-xs uppercase">Stardate</div>
            <div className="text-xl text-white">{stardate.toFixed(1)}</div>
        </div>
        <div>
            <div className="text-gray-500 text-xs uppercase">Condition</div>
            <div className={`text-xl font-bold ${getAlertColor()}`}>{alertLevel}</div>
        </div>
        <div>
            <div className="text-gray-500 text-xs uppercase">Position</div>
            <div className="text-white">Q{player.quadrant.x + 1},{player.quadrant.y + 1} - S{player.sector.x + 1},{player.sector.y + 1}</div>
        </div>
         <div>
            <div className="text-gray-500 text-xs uppercase">Klingons Remaining</div>
            <div className="text-red-400 font-bold">{klingonsLeft}</div>
        </div>

        <div className="col-span-1 md:col-span-2">
            <div className="flex justify-between text-xs uppercase text-gray-500">
                <span>Energy</span>
                <span>{Math.floor(player.energy)} / {player.maxEnergy}</span>
            </div>
            <Bar value={player.energy} max={player.maxEnergy} color="bg-green-500" />
        </div>

        <div className="col-span-1 md:col-span-2">
            <div className="flex justify-between text-xs uppercase text-gray-500">
                <span>Shields</span>
                <span>{Math.floor(player.shields)}</span>
            </div>
            <Bar value={player.shields} max={2000} color="bg-blue-500" />
        </div>
        
         <div className="col-span-1">
            <div className="text-gray-500 text-xs uppercase">Torpedoes</div>
            <div className="text-orange-400">{player.torpedoes}</div>
        </div>
    </div>
  );
};