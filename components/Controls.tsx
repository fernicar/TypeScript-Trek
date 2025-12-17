import React, { useState } from 'react';
import { GameCommand } from '../types';
import { COLORS } from '../constants';

interface ControlsProps {
  onCommand: (cmd: GameCommand, params?: any) => void;
  disabled: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ onCommand, disabled }) => {
  const [mode, setMode] = useState<'MAIN' | 'NAV' | 'WEAPON' | 'COMPUTER'>('MAIN');
  const [inputValue, setInputValue] = useState<string>('');

  const btnClass = `flex-1 py-3 px-2 border border-green-700 hover:bg-green-900 hover:text-white transition-colors uppercase text-xs md:text-sm font-bold tracking-wider disabled:opacity-30 disabled:cursor-not-allowed text-green-400 bg-black`;

  if (mode === 'NAV') {
    return (
      <div className="flex flex-col gap-2 p-2 border border-green-800 h-full">
        <h3 className="text-center text-green-400 border-b border-green-900 pb-1">NAVIGATION</h3>
        <div className="grid grid-cols-3 gap-2 flex-1">
          {[7, 8, 9, 4, null, 6, 1, 2, 3].map((num, i) => (
             num ? (
               <button 
                 key={num} 
                 className={btnClass}
                 onClick={() => setInputValue(num.toString())}
               >
                 {num}
               </button>
             ) : (
               <div key={i} className="flex items-center justify-center text-green-700">+</div>
             )
          ))}
        </div>
        <div className="flex gap-2">
            <input 
                type="number" 
                placeholder="Warp Factor (1-8)"
                className="bg-black border border-green-600 text-green-400 p-2 w-full text-center"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                min="0.1" max="9" step="0.1"
            />
        </div>
        <div className="flex gap-2">
            <button className={btnClass} onClick={() => setMode('MAIN')}>CANCEL</button>
            <button className={btnClass} onClick={() => {
                if(inputValue) {
                    onCommand(GameCommand.WARP, parseFloat(inputValue));
                    setInputValue('');
                    setMode('MAIN');
                }
            }}>ENGAGE</button>
        </div>
      </div>
    );
  }

  if (mode === 'WEAPON') {
      return (
        <div className="flex flex-col gap-2 p-2 border border-green-800 h-full">
            <h3 className="text-center text-red-400 border-b border-red-900 pb-1">TACTICAL</h3>
            <div className="flex flex-col gap-4 flex-1 justify-center">
                 <div className="space-y-2">
                    <label className="text-xs uppercase text-green-600">Phasers (Energy)</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            className="bg-black border border-green-600 text-green-400 p-2 flex-1"
                            placeholder="Amount"
                            id="phaser-amt"
                        />
                        <button className={btnClass} onClick={() => {
                            const val = (document.getElementById('phaser-amt') as HTMLInputElement).value;
                            if(val) onCommand(GameCommand.PHASERS, parseFloat(val));
                        }}>FIRE</button>
                    </div>
                 </div>
                 <div className="h-px bg-green-900 w-full"></div>
                 <div className="space-y-2">
                    <label className="text-xs uppercase text-green-600">Torpedo (Angle 0-360)</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            className="bg-black border border-green-600 text-green-400 p-2 flex-1"
                            placeholder="Degrees"
                            id="torp-ang"
                        />
                        <button className={`${btnClass} text-red-500 border-red-800 hover:bg-red-900`} onClick={() => {
                            const val = (document.getElementById('torp-ang') as HTMLInputElement).value;
                            if(val) onCommand(GameCommand.TORPEDO, parseFloat(val));
                        }}>FIRE</button>
                    </div>
                 </div>
            </div>
            <button className={btnClass} onClick={() => setMode('MAIN')}>BACK</button>
        </div>
      )
  }

  return (
    <div className="grid grid-cols-2 gap-2 h-full content-start">
      <button disabled={disabled} className={btnClass} onClick={() => onCommand(GameCommand.SRS)}>Short Scan</button>
      <button disabled={disabled} className={btnClass} onClick={() => onCommand(GameCommand.LRS)}>Long Scan</button>
      <button disabled={disabled} className={btnClass} onClick={() => setMode('NAV')}>Warp / Move</button>
      <button disabled={disabled} className={`${btnClass} text-red-400 border-red-900`} onClick={() => setMode('WEAPON')}>Weapons</button>
      <button disabled={disabled} className={btnClass} onClick={() => onCommand(GameCommand.SHIELDS)}>Toggle Shields</button>
      <button disabled={disabled} className={btnClass} onClick={() => onCommand(GameCommand.COMPUTER)}>Computer</button>
    </div>
  );
};