import { GameState, GameStats, Position, Tray, RobotColor, getColor, getBodyPart } from './types';
import {
  initBoard, swapPieces, isAdjacent,
  findMatches, removeMatched,
  applyGravity, fillEmpty,
  computeRobotAttack, clearAttackCells,
  hasValidMoves, shuffleBoard,
} from './Board';
import { SCORE_PER_PIECE, ROBOT_BONUS, LEVEL_TARGETS, COLOR_NAMES, COLOR_ATTACK } from './constants';
import { findBestMove } from './AI';
import { commitGame, loadLogs, saveLogs } from './Records';
import { DebugTools } from './DebugTools';

const CASCADE_DELAY   = 450;
const SWAP_ANIM_MS    = 300;
const CLEAR_ANIM_MS   = 400;
const ATTACK_ANIM_MS  = 750;
const FALL_ANIM_MS    = 350;
const MESSAGE_TIMEOUT = 1300;
const CPU_THINK_MS    = 800;

type StateListener = (state: GameState) => void;

function freshStats(): GameStats {
  return {
    startTime:      Date.now(),
    movesAttempted: 0,
    validMoves:     0,
    piecesCleared:  0,
    matches3:       0,
    matches4:       0,
    matches5plus:   0,
    bestCombo:      0,
    robotsLaunched: 0,
    robotsByColor:  { blue: 0, yellow: 0, green: 0, purple: 0, orange: 0 },
    shuffles:       0,
  };
}

export class Game {
  private _state:    GameState;
  private _listeners: StateListener[] = [];
  private _busy       = false;
  private _cpuMode    = false;
  private _cpuTimer:  ReturnType<typeof setTimeout> | null = null;
  private _debug:     DebugTools;

  constructor() {
    this._state = this._fresh();
    this._debug = new DebugTools(this);
  }

  private _fresh(): GameState {
    const stats = freshStats();
    return {
      board:       initBoard(),
      phase:       'idle',
      selected:    null,
      swapping:    null,
      falling:     [],
      clearing:    [],
      magnetizing: [],
      robotAttack: null,
      tray:        { headColor: null, headPower: 0, torsoColor: null, torsoPower: 0, legsColor: null, legsPower: 0 },
      score:       0,
      level:       1,
      targetScore: LEVEL_TARGETS[1],
      combo:       0,
      message:     '',
      stats:       stats,
      logs:        loadLogs(),
    };
  }

  private _addLog(type: 'move' | 'robot', title: string, detail: string): void {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      title,
      detail,
      timestamp: Date.now(),
    };
    // Keep last 50 logs
    const logs = [entry, ...this._state.logs].slice(0, 50);
    saveLogs(logs);
    this._patch({ logs });
  }

  subscribe(fn: StateListener): () => void {
    this._listeners.push(fn);
    fn(this._state);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  private _emit(): void { for (const fn of this._listeners) fn(this._state); }

  private _patch(partial: Partial<GameState>): void {
    this._state = { ...this._state, board: this._state.board, ...partial };
    this._emit();
  }

  private _patchStats(delta: Partial<GameStats>): void {
    this._state = { ...this._state, stats: { ...this._state.stats, ...delta } };
  }

  /**
   * DEBUG ONLY: Forces a robot attack of the given color and power.
   */
  public debugForceRobot(color: RobotColor, power: number): void {
    const announcement = `${COLOR_NAMES[color].toUpperCase()} ROBOT READY!`;
    const actionDesc = `${COLOR_ATTACK[color]} (LV${power} POWER!)`;
    
    this._addLog('robot', announcement, `DEBUG: Forcing robot with power level ${power}. Action: ${actionDesc}`);
    
    // Set tray to simulate the state
    const fakeTray = {
        headColor: color, headPower: power,
        torsoColor: color, torsoPower: power,
        legsColor: color, legsPower: power
    };
    
    this._patch({ phase: 'assembling', message: announcement, tray: fakeTray });
    this._busy = true;

    setTimeout(() => {
      const emptyTray = { headColor: null, headPower: 0, torsoColor: null, torsoPower: 0, legsColor: null, legsPower: 0 };
      const attackCells = computeRobotAttack(this._state.board, color, power);
      this._addLog('robot', `${COLOR_NAMES[color].toUpperCase()} ATTACK`, `Cleared ${attackCells.length} cells.`);

      this._patch({ 
        tray: emptyTray,
        robotAttack: { color, cells: attackCells, progress: 0 }, 
        message: `${announcement}  ·  ${actionDesc}` 
      });
      this._animateAttack(color, attackCells, 0, 0, [announcement], true, power);
    }, 1600);
  }

  get state(): GameState { return this._state; }

  // ── Player click ──────────────────────────────────────────────────────────
  handleClick(pos: Position): void {
    if (this._busy || this._cpuMode) return;
    const { selected } = this._state;

    if (!selected) {
      if (this._state.board[pos.row][pos.col]) this._patch({ selected: pos, phase: 'selected' });
      return;
    }
    if (selected.row === pos.row && selected.col === pos.col) {
      this._patch({ selected: null, phase: 'idle' });
      return;
    }
    if (isAdjacent(selected, pos)) {
      this._busy = true;
      this._patchStats({ movesAttempted: this._state.stats.movesAttempted + 1 });
      this._patch({ selected: null, phase: 'swapping', swapping: { a: selected, b: pos, progress: 0 } });
      this._animateSwap(selected, pos);
      return;
    }
    if (this._state.board[pos.row][pos.col]) this._patch({ selected: pos });
  }

  // ── CPU mode ──────────────────────────────────────────────────────────────
  setCpuMode(enabled: boolean): void {
    this._cpuMode = enabled;
    if (!enabled) {
      if (this._cpuTimer !== null) { clearTimeout(this._cpuTimer); this._cpuTimer = null; }
      this._patch({ message: '' });
    } else {
      if (!this._busy && this._state.phase === 'idle') {
        this._scheduleCpuMove();
      } else {
        this._patch({ message: 'CPU: waiting...' });
      }
    }
  }

  get cpuMode(): boolean { return this._cpuMode; }

  private _scheduleCpuMove(): void {
    if (!this._cpuMode || this._busy) return;
    if (this._cpuTimer) return; // Already thinking
    
    this._patch({ message: 'CPU: thinking...' });
    this._cpuTimer = setTimeout(() => {
      this._cpuTimer = null;
      if (!this._cpuMode || this._busy) return;
      
      const move = findBestMove(this._state.board, this._state.tray);
      if (!move) { 
        this._patch({ message: 'CPU: No moves found' }); 
        return; 
      }
      
      this._patch({ message: '', selected: move.a });
      
      setTimeout(() => {
        if (!this._cpuMode || this._busy) return;
        
        this._busy = true;
        this._patchStats({ movesAttempted: this._state.stats.movesAttempted + 1 });
        this._patch({ selected: null, phase: 'swapping', swapping: { a: move.a, b: move.b, progress: 0 } });
        this._animateSwap(move.a, move.b);
      }, 250);
    }, CPU_THINK_MS);
  }

  commitAndRestart(): void {
    commitGame(this._state.score, this._state.stats);
    this.restart();
  }

  restart(): void {
    if (this._cpuTimer !== null) { clearTimeout(this._cpuTimer); this._cpuTimer = null; }
    this._busy  = false;
    this._state = this._fresh();
    this._emit();
    if (this._cpuMode) this._scheduleCpuMove();
  }

  // ── Swap attempt ──────────────────────────────────────────────────────────
  private _animateSwap(a: Position, b: Position): void {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / SWAP_ANIM_MS);
      this._patch({ swapping: { a, b, progress } });
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        this._patch({ swapping: null, phase: 'resolving' });
        this._attemptSwap(a, b);
      }
    };
    requestAnimationFrame(tick);
  }

  private _attemptSwap(a: Position, b: Position): void {
    swapPieces(this._state.board, a, b);
    const result = findMatches(this._state.board);

    if (result.positions.size === 0) {
      swapPieces(this._state.board, a, b);
      this._busy = false; // Reset busy before patch
      this._addLog('move', 'Invalid Swap', `No match formed at (${a.row},${a.col}) and (${b.row},${b.col})`);
      this._patch({ phase: 'idle', message: 'No match!' });
      setTimeout(() => {
        this._patch({ message: '' });
        if (this._cpuMode) this._scheduleCpuMove();
      }, MESSAGE_TIMEOUT);
    } else {
      this._addLog('move', 'Valid Swap', `Match formed at (${a.row},${a.col}) and (${b.row},${b.col})`);
      this._patchStats({ validMoves: this._state.stats.validMoves + 1 });
      this._resolveLoop(0);
    }
  }

  // ── Cascading resolve loop ────────────────────────────────────────────────
  private _resolveLoop(combo: number): void {
    const result = findMatches(this._state.board);

    if (result.positions.size === 0) {
      this._busy = false;
      this._patch({ phase: 'idle', combo: 0, message: '' });
      this._checkLevelUp();
      this._checkDeadlock();
      if (this._cpuMode) this._scheduleCpuMove();
      return;
    }

    const msgs: string[] = [];
    const s = this._state.stats;
    const multiplier = 1 + combo * 0.5;
    let gained = Math.round(result.positions.size * SCORE_PER_PIECE * multiplier);

    // Match quality stats
    const newBestCombo = Math.max(s.bestCombo, combo + 1);
    if (result.has5plus) {
      this._patchStats({ matches5plus: s.matches5plus + 1, piecesCleared: s.piecesCleared + result.positions.size, bestCombo: newBestCombo });
      msgs.push('5-IN-A-ROW!');
    } else if (result.has4plusH || result.has4plusV) {
      this._patchStats({ matches4: s.matches4 + 1, piecesCleared: s.piecesCleared + result.positions.size, bestCombo: newBestCombo });
      msgs.push('4-MATCH!');
    } else {
      this._patchStats({ matches3: s.matches3 + 1, piecesCleared: s.piecesCleared + result.positions.size, bestCombo: newBestCombo });
    }
    if (combo >= 2) msgs.push(`COMBO ×${combo}!`);

    // ── Tray logic (process BEFORE removing from board) ───────────────────
    let tray = { ...this._state.tray };
    let robotFired = false;
    let firedColor: RobotColor | null = null;
    let isUltimate = false;
    let finalPower = 3;

    for (const [type, power] of result.matchedTypes) {
      const color = getColor(type);
      const body  = getBodyPart(type);
      
      // Only lock in if the slot is currently empty (null)
      if (body === 'head' && tray.headColor === null)  { 
        tray.headColor  = color; tray.headPower  = power; 
        this._addLog('move', 'Part Collected', `HEAD: ${COLOR_NAMES[color].toUpperCase()} (Power ${power})`);
      }
      if (body === 'torso' && tray.torsoColor === null) { 
        tray.torsoColor = color; tray.torsoPower = power; 
        this._addLog('move', 'Part Collected', `TORSO: ${COLOR_NAMES[color].toUpperCase()} (Power ${power})`);
      }
      if (body === 'legs' && tray.legsColor === null)  { 
        tray.legsColor  = color; tray.legsPower  = power; 
        this._addLog('move', 'Part Collected', `LEGS: ${COLOR_NAMES[color].toUpperCase()} (Power ${power})`);
      }
    }

    if (tray.headColor && tray.torsoColor && tray.legsColor) {
      robotFired = true;
      const counts: Record<RobotColor, number> = { blue: 0, yellow: 0, green: 0, purple: 0, orange: 0 };
      counts[tray.headColor]++;
      counts[tray.torsoColor]++;
      counts[tray.legsColor]++;
      
      let maxCount = 0;
      for (const color of Object.keys(counts) as RobotColor[]) {
        if (counts[color] > maxCount) { maxCount = counts[color]; firedColor = color; }
      }
      
      if (maxCount === 1) {
        const colors = [tray.headColor, tray.torsoColor, tray.legsColor];
        firedColor = colors[Math.floor(Math.random() * 3)];
      }

      isUltimate = (maxCount === 3);
      // Final power is based on the average power of the 3 parts (rounded up)
      // Ultimate bonus: double the power if matching 3 of same color
      const basePower = Math.ceil((tray.headPower + tray.torsoPower + tray.legsPower) / 3);
      finalPower = isUltimate ? basePower * 2 : basePower;
    }

    // ── Animate clear ──────────────────────────────────────────────────────
    const toClear = Array.from(result.positions).map(key => {
      const [r, c] = key.split(',').map(Number);
      const piece = this._state.board[r][c];
      return { r, c, progress: 0, type: piece!.type };
    });

    this._patch({ clearing: toClear, tray, phase: 'animating' });

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / CLEAR_ANIM_MS);
      this._patch({ clearing: toClear.map(cl => ({ ...cl, progress })) });
      if (progress < 1) { requestAnimationFrame(tick); return; }

      this._patch({ clearing: [] });
      removeMatched(this._state.board, result);

      // ── Robot Tension Delay ───────────────────────────────────────────
      if (robotFired && firedColor) {
        const namePrefix = isUltimate ? 'ULTIMATE ' : '';
        const powerSuffix = finalPower > 3 ? ` (LV${finalPower} POWER!)` : '';
        const announcement = `${namePrefix}${COLOR_NAMES[firedColor].toUpperCase()} ROBOT READY!`;
        const actionDesc = `${COLOR_ATTACK[firedColor]}${powerSuffix}`;
        
        this._addLog('robot', announcement, `Assembled with power level ${finalPower}. Action: ${actionDesc}`);
        
        // SWITCH: Keep the "tray" full during the assembling phase so the UI shows the READY state.
        // We will clear the tray AFTER the delay, right as the attack begins shooting.
        this._patch({ phase: 'assembling', message: announcement });

        // Wait 1.6 seconds to build tension
        setTimeout(() => {
          // Clear the workbench tray NOW, as the firing animation begins
          const emptyTray = { headColor: null, headPower: 0, torsoColor: null, torsoPower: 0, legsColor: null, legsPower: 0 };
          
          const attackCells = computeRobotAttack(this._state.board, firedColor!, finalPower);
          this._addLog('robot', `${COLOR_NAMES[firedColor!].toUpperCase()} ATTACK`, `Cleared ${attackCells.length} cells.`);

          this._patch({ 
            tray: emptyTray,
            robotAttack: { color: firedColor!, cells: attackCells, progress: 0 }, 
            message: `${announcement}  ·  ${actionDesc}` 
          });
          this._animateAttack(firedColor!, attackCells, combo, gained, msgs, isUltimate, finalPower);
        }, 1600);
      } else {
        // Not a robot turn, clear tray normally (likely just matching colors)
        this._patch({ tray }); 
        this._animateFalling(combo, gained, msgs);
      }
    };
    requestAnimationFrame(tick);
  }

  private _animateAttack(color: RobotColor, cells: { r: number; c: number }[], combo: number, gained: number, msgs: string[], isUltimate: boolean, finalPower: number): void {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / ATTACK_ANIM_MS);
      this._patch({ robotAttack: { color, cells, progress } });
      if (progress < 1) { requestAnimationFrame(tick); return; }

      // Animation done — apply the attack
      this._patch({ robotAttack: null });
      const attackCleared = clearAttackCells(this._state.board, cells);
      const rs = this._state.stats;
      this._patchStats({
        robotsLaunched: rs.robotsLaunched + 1,
        robotsByColor: { ...rs.robotsByColor, [color]: rs.robotsByColor[color] + 1 },
      });
      
      const bonusBase = isUltimate ? ROBOT_BONUS * 2 : ROBOT_BONUS;
      // Bonus scales with power (3rd piece is 100%, 4th is 125%, 5th is 150%, etc)
      const powerMult = 1 + (finalPower - 3) * 0.25;
      gained += Math.round(bonusBase * powerMult) + attackCleared.size * SCORE_PER_PIECE;
      this._animateFalling(combo, gained, msgs);
    };
    requestAnimationFrame(tick);
  }

  private _animateFalling(combo: number, gained: number, msgs: string[]): void {
    const oldBoard = this._state.board.map(r => [...r]);
    applyGravity(this._state.board);
    fillEmpty(this._state.board);
    const newBoard = this._state.board;

    const falling: GameState['falling'] = [];
    const cellSize = 68; // Matching constant

    for (let c = 0; c < 8; c++) { // BOARD_COLS
      for (let r = 7; r >= 0; r--) { // BOARD_ROWS
        const piece = newBoard[r][c];
        if (!piece) continue;

        // Find where it came from
        let startY = -cellSize; // Default for new pieces
        let found = false;
        for (let or = 0; or < 8; or++) {
          if (oldBoard[or][c]?.id === piece.id) {
            startY = or * cellSize;
            found = true;
            break;
          }
        }
        
        const targetY = r * cellSize;
        if (startY !== targetY) {
          falling.push({ id: piece.id, startY, currentY: startY });
        }
      }
    }

    if (falling.length === 0) {
      this._finalizeResolve(combo, gained, msgs);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / FALL_ANIM_MS);
      // Ease in for gravity feel
      const ease = progress * progress;

      const currentFalling = falling.map(f => {
        const targetY = newBoard.flat().find(p => p?.id === f.id)!.row * cellSize;
        return { ...f, currentY: f.startY + (targetY - f.startY) * ease };
      });

      this._patch({ falling: currentFalling });

      if (progress < 1) requestAnimationFrame(tick);
      else {
        this._patch({ falling: [] });
        this._finalizeResolve(combo, gained, msgs);
      }
    };
    requestAnimationFrame(tick);
  }

  private _finalizeResolve(combo: number, gained: number, msgs: string[]): void {
    this._patch({ score: this._state.score + gained, combo: combo + 1, message: msgs.join('  ·  ') });

    setTimeout(() => {
      this._resolveLoop(combo + 1);
    }, CASCADE_DELAY);
  }

  // ── Deadlock check ────────────────────────────────────────────────────────
  private _checkDeadlock(): void {
    if (hasValidMoves(this._state.board)) return;
    this._patchStats({ shuffles: this._state.stats.shuffles + 1 });
    this._busy = true; // Set busy before starting shuffle flow
    this._patch({ message: 'No more moves — shuffling!' });
    
    setTimeout(() => {
      shuffleBoard(this._state.board);
      this._busy = false; // Reset busy after shuffle finishes
      this._patch({ message: '' });
      if (this._cpuMode) this._scheduleCpuMove();
    }, 1400);
  }

  // ── Level-up check ────────────────────────────────────────────────────────
  private _checkLevelUp(): void {
    const { score, level } = this._state;
    const maxLevel = LEVEL_TARGETS.length - 1;
    
    // Find what the level SHOULD be based on the score
    let targetLevel = 1;
    for (let i = 1; i < LEVEL_TARGETS.length; i++) {
        if (score >= LEVEL_TARGETS[i]) {
            targetLevel = i + 1;
        } else {
            break;
        }
    }
    
    // Clamp to max level defined in constants
    targetLevel = Math.min(targetLevel, maxLevel);

    if (targetLevel <= level) return;

    const nextLevel  = targetLevel;
    const nextTarget = LEVEL_TARGETS[Math.min(nextLevel, maxLevel)];
    
    this._busy = true;
    this._patch({ level: nextLevel, targetScore: nextTarget, message: `LEVEL ${nextLevel}!` });

    setTimeout(() => {
      this._state = { ...this._state, board: initBoard(), message: '', phase: 'idle' };
      this._emit();
      this._busy = false;
      if (this._cpuMode) this._scheduleCpuMove();
    }, 1600);
  }
}
