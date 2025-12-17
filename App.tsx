import React, { useState, useEffect, useCallback } from 'react';
import { 
    GameState, QuadrantData, Entity, Player, EntityType, GameCommand, Position 
} from './types';
import { 
    INITIAL_ENERGY, INITIAL_TORPEDOES, INITIAL_STARDATE, GRID_SIZE, SECTOR_SIZE,
    TIME_LIMIT, WARP_ENERGY_COST, MOVE_TIME_COST, PHASER_EFFICIENCY,
    KLINGON_MAX_HP, SHIELD_DRAIN_PER_HIT, COLORS
} from './constants';
import { 
    generateGalaxy, generateSectorMap, calculateDistance, 
    degreesToRadians, getKlingonDamage, formatCoordinates 
} from './services/engine';
import { Terminal } from './components/Terminal';
import { Grid } from './components/Grid';
import { Controls } from './components/Controls';
import { StatusDisplay } from './components/StatusDisplay';

const App: React.FC = () => {
    // --- State ---
    const [gameState, setGameState] = useState<GameState | null>(null);

    // --- Initialization ---
    useEffect(() => {
        startNewGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const log = (msg: string) => {
        setGameState(prev => {
            if (!prev) return null;
            return { ...prev, messages: [...prev.messages, msg] };
        });
    };

    const startNewGame = () => {
        const galaxy = generateGalaxy();
        let totalKlingons = 0;
        galaxy.forEach(row => row.forEach(q => totalKlingons += q.klingons));

        const startQ = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        const startS = { x: Math.floor(Math.random() * SECTOR_SIZE), y: Math.floor(Math.random() * SECTOR_SIZE) };
        
        // Initial player state
        const player: Player = {
            quadrant: startQ,
            sector: startS,
            energy: INITIAL_ENERGY,
            shields: 0,
            maxEnergy: INITIAL_ENERGY,
            torpedoes: INITIAL_TORPEDOES,
            alive: true,
            docked: false,
        };

        const initialMap = generateSectorMap(galaxy[startQ.x][startQ.y], startS);

        setGameState({
            stardate: INITIAL_STARDATE,
            maxTime: INITIAL_STARDATE + TIME_LIMIT,
            galaxy,
            currentSectorMap: initialMap,
            player,
            messages: [
                `<span class="${COLORS.PRIMARY}">TYPE-SCRIPT TREK</span> initialized.`,
                "Orders: Destroy all Klingon warships in the galaxy.",
                `You have ${TIME_LIMIT} solar days.`,
                `Klingons detected: ${totalKlingons}`,
                "Good luck, Captain."
            ],
            alertLevel: 'GREEN',
            totalKlingons,
            gameOver: false,
            win: false
        });
    };

    // --- Helpers ---
    const updateAlertLevel = (klingonCount: number) => {
        if (klingonCount > 0) return 'RED';
        // Note: Could check for adjacent klingons for YELLOW, simple logic for now
        return 'GREEN';
    };

    const checkDocking = (sectorMap: Entity[], p: Player): boolean => {
        // Simple check: is adjacent to starbase?
        const bases = sectorMap.filter(e => e.type === EntityType.STARBASE);
        for (const b of bases) {
            if (Math.abs(b.x - p.sector.x) <= 1 && Math.abs(b.y - p.sector.y) <= 1) {
                return true;
            }
        }
        return false;
    };

    const enemyTurn = (currentState: GameState): GameState => {
        let newState = { ...currentState };
        const klingons = newState.currentSectorMap.filter(e => e.type === EntityType.KLINGON);
        
        if (klingons.length === 0) return newState;

        let totalDamage = 0;
        const hitMessages: string[] = [];

        klingons.forEach(k => {
            const damage = getKlingonDamage();
            totalDamage += damage;
            hitMessages.push(`Klingon at ${k.x + 1},${k.y + 1} fires! <span class="${COLORS.DANGER}">${damage} damage</span>.`);
        });

        // Absorb with shields first
        let hullDamage = 0;
        if (newState.player.shields >= totalDamage) {
            newState.player.shields -= totalDamage;
        } else {
            hullDamage = totalDamage - newState.player.shields;
            newState.player.shields = 0;
            newState.player.energy -= hullDamage;
        }

        newState.messages = [...newState.messages, ...hitMessages];

        if (hullDamage > 0) {
            newState.messages.push(`<span class="${COLORS.DANGER}">SHIELDS BUCKLED! Hull hit for ${hullDamage} units.</span>`);
        }

        if (newState.player.energy <= 0) {
            newState.player.alive = false;
            newState.gameOver = true;
            newState.messages.push(`<span class="${COLORS.DANGER}">CRITICAL FAILURE. ENTERPRISE DESTROYED.</span>`);
        }

        return newState;
    };

    // --- Command Handlers ---

    const handleCommand = (cmd: GameCommand, params?: any) => {
        if (!gameState || gameState.gameOver) return;

        let newState = { ...gameState };
        let turnPassed = false;

        switch (cmd) {
            case GameCommand.SRS:
                newState.messages.push("Short Range Scan complete.");
                // The grid automatically updates via state, just log it.
                break;

            case GameCommand.LRS:
                newState.messages.push("Long Range Scan processing...");
                const { x: qx, y: qy } = newState.player.quadrant;
                let gridStr = '<div class="grid grid-cols-3 gap-1 w-32 font-mono text-center my-2">';
                
                for (let y = qy - 1; y <= qy + 1; y++) {
                    for (let x = qx - 1; x <= qx + 1; x++) {
                        let cellContent = '***';
                        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                            const q = newState.galaxy[x][y];
                            q.scanned = true;
                            // Format: Klingons Starbases Stars (e.g., 105)
                            cellContent = `${q.klingons}${q.starbases}${q.stars}`;
                            if(x === qx && y === qy) cellContent = `<span class="${COLORS.PRIMARY}">${cellContent}</span>`;
                        }
                        gridStr += `<div class="border border-green-900 bg-black p-1">${cellContent}</div>`;
                    }
                }
                gridStr += '</div>';
                newState.messages.push(gridStr);
                break;

            case GameCommand.SHIELDS:
                // Simple toggle: Transfer energy to shields or back? 
                // Let's do a simple "Fill Shields" or "Drain Shields". 
                // For simplicity: Fill shields to max or 50% energy.
                // Let's prompt input? No, simplified: Toggle max shields.
                // If shields < 200, pump 500 energy into it.
                // Better yet: Modal UI would be nice, but let's stick to simple logic:
                // "Shields Max"
                const transfer = Math.min(gameState.player.energy - 100, 2000 - gameState.player.shields);
                if (transfer > 0) {
                    newState.player.energy -= transfer;
                    newState.player.shields += transfer;
                    newState.messages.push(`Transferred ${transfer} units to shields.`);
                } else {
                    newState.messages.push("Insufficient energy reserves for shield transfer.");
                }
                break;
            
            case GameCommand.COMPUTER:
                 // Find nearest Klingon or Starbase
                 const targets = newState.currentSectorMap.filter(e => e.type === EntityType.KLINGON || e.type === EntityType.STARBASE);
                 if (targets.length === 0) {
                     newState.messages.push("Computer: No significant targets in sector.");
                 } else {
                     newState.messages.push("Computer: Calculation results:");
                     targets.forEach(t => {
                         const dist = calculateDistance(newState.player.sector, {x: t.x, y: t.y});
                         // Angle calculation for display: Cartesian from Player
                         const dx = t.x - newState.player.sector.x;
                         const dy = newState.player.sector.y - t.y; // Invert Y
                         let theta = Math.atan2(dy, dx) * 180 / Math.PI;
                         if (theta < 0) theta += 360;
                         newState.messages.push(`${t.type === EntityType.KLINGON ? 'Klingon' : 'Starbase'} at ${t.x+1},${t.y+1} -> Dist: ${dist.toFixed(2)}, Angle: ${theta.toFixed(1)}°`);
                     });
                 }
                 break;

            case GameCommand.WARP:
                // Params: Input 1-9 (Numpad directions) or float.
                // Let's assume input is 1-9 direction.
                // 8=North, 6=East, 2=South, 4=West.
                // 1=SW, 3=SE, 7=NW, 9=NE.
                // 5=Stay.
                // Actually, the prompt implies "Warp Drive" is for movement. 
                // Let's implement simpler: Warp Factor (speed) + Direction?
                // The UI passes a single number which might be sector index?
                // The UI implemented 1-9 buttons. Let's treat them as directions.
                // 1 Sector step per click? Or Warp Factor input?
                // The UI has both buttons and an input for "Warp Factor".
                // If buttons: Standard move 1 sector.
                // If input: Move X distance? How to specify direction?
                // REVISED UI LOGIC: Buttons set direction vector. Input sets distance (Warp Factor).
                // But the UI sends `WARP` with a single param.
                // Let's assume the UI sends a direction digit (1-9) as param if clicked, OR a float if "ENGAGE" with input.
                // Wait, the UI logic is: "Buttons set input value". Then "Engage" sends that value.
                // So valid input is a single number.
                // Let's reinterpret standard Star Trek input: `COURSE (1-9), WARP FACTOR (1-8)`.
                // For this simplified web app, let's treat the Numpad buttons as "Move 1 Sector in that direction".
                // And the Input field as "Warp Jump to adjacent quadrant".
                
                // Let's simplify: 
                // Input = Direction (1-9). Distance = 1 Sector.
                // If user wants to warp far, they do it step by step or we add a distance modifier?
                // Let's make "Warp Factor" = Distance in sectors.
                // Direction? We need direction.
                // Let's update the Controls component to handle Direction + Distance.
                // *Self-Correction*: I can't change Controls easily without rewriting the change block.
                // Current Controls UI: Numpad buttons set the input value to "7", "8", etc.
                // "Engage" sends that number. 
                // Problem: That's just a number. Is it a direction or a destination?
                // Let's interpret 1-9 integers as DIRECTIONS for 1 sector impulse move.
                // Let's interpret floats like 1.5, or >9 as actual Warp Settings? No, complicated.
                
                // Let's change the interpretation: 
                // 1-9 are directions. 
                // Distance is always 1 quadrant sector unless specified?
                // Let's stick to: Move 1 sector in direction X. 
                // If you hit edge, you change quadrant.
                
                const dir = parseInt(params);
                let dx = 0, dy = 0;
                // Numpad mapping to dx/dy
                if ([7, 8, 9].includes(dir)) dy = -1;
                if ([1, 2, 3].includes(dir)) dy = 1;
                if ([7, 4, 1].includes(dir)) dx = -1;
                if ([9, 6, 3].includes(dir)) dx = 1;

                if (dx === 0 && dy === 0) {
                     newState.messages.push("Holding position.");
                } else {
                    // Calculate Energy Cost
                    const moveCost = WARP_ENERGY_COST;
                    if (newState.player.energy < moveCost) {
                        newState.messages.push(`<span class="${COLORS.WARNING}">Insufficient energy for maneuvers.</span>`);
                    } else {
                        newState.player.energy -= moveCost;
                        newState.stardate += MOVE_TIME_COST;
                        
                        // Move
                        let newSx = newState.player.sector.x + dx;
                        let newSy = newState.player.sector.y + dy;
                        let newQx = newState.player.quadrant.x;
                        let newQy = newState.player.quadrant.y;
                        let quadChanged = false;

                        // Check Boundary
                        if (newSx < 0) { newSx = SECTOR_SIZE - 1; newQx--; quadChanged = true; }
                        else if (newSx >= SECTOR_SIZE) { newSx = 0; newQx++; quadChanged = true; }
                        
                        if (newSy < 0) { newSy = SECTOR_SIZE - 1; newQy--; quadChanged = true; }
                        else if (newSy >= SECTOR_SIZE) { newSy = 0; newQy++; quadChanged = true; }

                        // Check Galaxy Bounds
                        if (newQx < 0 || newQx >= GRID_SIZE || newQy < 0 || newQy >= GRID_SIZE) {
                            newState.messages.push(`<span class="${COLORS.DANGER}">Galactic Barrier reached. Reversing course.</span>`);
                            // Undo move
                        } else {
                            // Check collision in CURRENT sector if not changing quadrant
                            let blocked = false;
                            if (!quadChanged) {
                                const obstacle = newState.currentSectorMap.find(e => e.x === newSx && e.y === newSy);
                                if (obstacle) {
                                    newState.messages.push(`<span class="${COLORS.WARNING}">Collision alert! Navigation blocked by ${obstacle.type === EntityType.KLINGON ? 'Klingon' : 'Stellar Object'}.</span>`);
                                    blocked = true;
                                }
                            }

                            if (!blocked) {
                                newState.player.quadrant = { x: newQx, y: newQy };
                                newState.player.sector = { x: newSx, y: newSy };
                                
                                if (quadChanged) {
                                    newState.messages.push(`Entering Quadrant ${newQx + 1},${newQy + 1}`);
                                    newState.currentSectorMap = generateSectorMap(newState.galaxy[newQx][newQy], newState.player.sector);
                                    // Klingons in this new sector?
                                    const kCount = newState.currentSectorMap.filter(e => e.type === EntityType.KLINGON).length;
                                    newState.alertLevel = updateAlertLevel(kCount);
                                    newState.messages.push(kCount > 0 ? `<span class="${COLORS.DANGER}">COMBAT ALERT: ${kCount} KLINGONS DETECTED</span>` : "Sector clear.");
                                } else {
                                    // Update Enterprise position in entity map
                                    newState.currentSectorMap = newState.currentSectorMap.map(e => {
                                        if (e.type === EntityType.ENTERPRISE) return { ...e, x: newSx, y: newSy };
                                        return e;
                                    });
                                    newState.messages.push(`Course plotted. Arrived at S${newSx+1},${newSy+1}.`);
                                }
                                turnPassed = true;
                                
                                // Check Docking
                                const docked = checkDocking(newState.currentSectorMap, newState.player);
                                newState.player.docked = docked;
                                if (docked) {
                                    newState.messages.push(`<span class="${COLORS.PRIMARY}">Docked with Starbase. Systems replenishing.</span>`);
                                    newState.player.energy = newState.player.maxEnergy;
                                    newState.player.torpedoes = INITIAL_TORPEDOES;
                                    newState.player.shields = 2000;
                                }
                            }
                        }
                    }
                }
                break;

            case GameCommand.PHASERS:
                const amount = parseFloat(params);
                if (isNaN(amount) || amount <= 0) {
                     newState.messages.push("Invalid phaser setting.");
                } else if (newState.player.energy < amount) {
                     newState.messages.push("Insufficient energy.");
                } else {
                    newState.player.energy -= amount;
                    newState.messages.push(`Firing Phasers with ${amount} units...`);
                    
                    const targets = newState.currentSectorMap.filter(e => e.type === EntityType.KLINGON);
                    if (targets.length === 0) {
                        newState.messages.push("Sensors confirm: Energy dissipated into space.");
                    } else {
                        // Auto-target all Klingons in sector (classic mechanic)
                        targets.forEach(k => {
                            const dist = calculateDistance(newState.player.sector, {x: k.x, y: k.y});
                            const dmg = Math.floor((amount / targets.length) / dist * PHASER_EFFICIENCY);
                            // Apply random variance
                            const finalDmg = Math.max(0, dmg + (Math.floor(Math.random() * 20) - 10));
                            
                            k.hp = (k.hp || KLINGON_MAX_HP) - finalDmg;
                            newState.messages.push(`Target at ${k.x+1},${k.y+1} hit for <span class="${COLORS.WARNING}">${finalDmg} damage</span>.`);
                            
                            if (k.hp <= 0) {
                                newState.messages.push(`<span class="${COLORS.PRIMARY}">TARGET DESTROYED.</span>`);
                                // Remove from map
                                newState.currentSectorMap = newState.currentSectorMap.filter(e => e.id !== k.id);
                                // Update Galaxy count
                                newState.galaxy[newState.player.quadrant.x][newState.player.quadrant.y].klingons--;
                                newState.totalKlingons--;
                            }
                        });
                        // Update the map state references
                        newState.currentSectorMap = [...newState.currentSectorMap];
                    }
                    turnPassed = true;
                }
                break;

            case GameCommand.TORPEDO:
                const angleDeg = parseFloat(params);
                if (newState.player.torpedoes <= 0) {
                    newState.messages.push("Torpedo tubes empty!");
                } else if (isNaN(angleDeg)) {
                    newState.messages.push("Invalid firing angle.");
                } else {
                    newState.player.torpedoes--;
                    newState.messages.push(`Torpedo fired at heading ${angleDeg}°...`);
                    
                    // Trace path
                    // Angle 0 = East (Right), 90 = North (Up).
                    // In Grid: Right is +X, Up is -Y.
                    // X = cos(theta), Y = -sin(theta)
                    const theta = degreesToRadians(angleDeg);
                    const stepX = Math.cos(theta);
                    const stepY = -Math.sin(theta); // Flip Y for screen coords
                    
                    let currX = newState.player.sector.x;
                    let currY = newState.player.sector.y;
                    let hit = false;
                    
                    // Simple ray marching
                    for (let i = 0; i < SECTOR_SIZE * 1.5; i++) {
                        currX += stepX;
                        currY += stepY;
                        
                        const checkX = Math.round(currX);
                        const checkY = Math.round(currY);
                        
                        if (checkX < 0 || checkX >= SECTOR_SIZE || checkY < 0 || checkY >= SECTOR_SIZE) {
                            newState.messages.push("Torpedo missed (out of range).");
                            hit = true; 
                            break;
                        }

                        // Check collision
                        // Exclude self (Enterprise is at original coords, but we stepped away)
                        if (checkX === newState.player.sector.x && checkY === newState.player.sector.y && i < 1) continue;

                        const entity = newState.currentSectorMap.find(e => e.x === checkX && e.y === checkY);
                        if (entity) {
                            if (entity.type === EntityType.KLINGON) {
                                newState.messages.push(`<span class="${COLORS.DANGER}">DIRECT HIT! Klingon vessel destroyed.</span>`);
                                newState.currentSectorMap = newState.currentSectorMap.filter(e => e.id !== entity.id);
                                newState.galaxy[newState.player.quadrant.x][newState.player.quadrant.y].klingons--;
                                newState.totalKlingons--;
                                hit = true;
                                break;
                            } else if (entity.type === EntityType.STARBASE) {
                                newState.messages.push(`<span class="${COLORS.DANGER}">FEDERATION STARBASE DESTROYED! YOU TRAITOR!</span>`);
                                newState.currentSectorMap = newState.currentSectorMap.filter(e => e.id !== entity.id);
                                newState.galaxy[newState.player.quadrant.x][newState.player.quadrant.y].starbases--;
                                newState.win = false;
                                newState.gameOver = true; // Lose condition for killing friendly
                                hit = true;
                                break;
                            } else if (entity.type === EntityType.STAR) {
                                newState.messages.push(`Torpedo absorbed by star at ${checkX+1},${checkY+1}.`);
                                hit = true;
                                break;
                            }
                        }
                    }
                    if(!hit) newState.messages.push("Torpedo missed.");
                    turnPassed = true;
                }
                break;
        }

        // --- Post-Action Checks ---

        // Check Win
        if (newState.totalKlingons <= 0 && !newState.gameOver) {
            newState.messages.push(`<span class="${COLORS.PRIMARY}">MISSION ACCOMPLISHED. The galaxy is safe.</span>`);
            newState.win = true;
            newState.gameOver = true;
        }

        // Enemy Reaction
        if (turnPassed && !newState.gameOver) {
             newState = enemyTurn(newState);
        }

        // Time Check
        if (newState.stardate > newState.maxTime && !newState.gameOver) {
            newState.gameOver = true;
            newState.messages.push(`<span class="${COLORS.DANGER}">TIME LIMIT EXCEEDED. Mission Failed.</span>`);
        }

        setGameState(newState);
    };

    if (!gameState) return <div className="bg-black text-green-500 font-mono h-screen flex items-center justify-center">INITIALIZING...</div>;

    return (
        <div className="h-screen w-screen bg-black text-green-500 font-mono flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Display and Status */}
            <div className="flex-1 flex flex-col p-2 gap-2 h-1/2 md:h-full overflow-hidden">
                 <StatusDisplay 
                    player={gameState.player} 
                    stardate={gameState.stardate} 
                    alertLevel={gameState.alertLevel}
                    klingonsLeft={gameState.totalKlingons}
                 />
                 
                 <div className="flex-1 flex items-center justify-center bg-gray-900 border border-green-800 relative">
                    <Grid entities={gameState.currentSectorMap} />
                    {gameState.gameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-10">
                            <h1 className={`text-4xl font-bold mb-4 ${gameState.win ? 'text-blue-400' : 'text-red-500'}`}>
                                {gameState.win ? 'VICTORY' : 'GAME OVER'}
                            </h1>
                            <button 
                                onClick={startNewGame}
                                className="px-6 py-2 border-2 border-green-500 text-green-400 hover:bg-green-900 transition-colors uppercase font-bold"
                            >
                                Re-Initialize
                            </button>
                        </div>
                    )}
                 </div>
            </div>

            {/* Right Column: Log and Controls */}
            <div className="flex-1 flex flex-col p-2 gap-2 h-1/2 md:h-full">
                <div className="flex-1 overflow-hidden relative">
                    <Terminal messages={gameState.messages} />
                </div>
                <div className="h-1/3 min-h-[200px]">
                    <Controls onCommand={handleCommand} disabled={gameState.gameOver} />
                </div>
            </div>
        </div>
    );
};

export default App;