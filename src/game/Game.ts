import { GameState, GameStats, Position, HeadVariant, TorsoVariant, LegsVariant, isRobotPart } from './types';
import {
  initBoard, swapPieces, isAdjacent,
  findMatches, removeMatched,
  applyGravity, fillEmpty,
  applyComboRobotPower,
  getMagnetMoves, applyMagnetPull,
  hasValidMoves, shuffleBoard,
} from './Board';
import { SCORE_PER_PIECE, ROBOT_BONUS, LEVEL_TARGETS } from './constants';
import { findBestMove } from './AI';
import { commitGame } from './Records';

const CASCADE_DELAY   = 450;
const SWAP_ANIM_MS    = 300;
const CLEAR_ANIM_MS   = 400;
const MAGNET_ANIM_MS  = 750;
const FALL_ANIM_MS    = 350;
const MESSAGE_TIMEOUT = 1300;
const CPU_THINK_MS    = 800;

type StateListener = (state: GameState) => void;

function freshStats(): GameStats {
  return {
    startTime:        Date.now(),
    movesAttempted:   0,
    validMoves:       0,
    piecesCleared:    0,
    matches3:         0,
    matches4:         0,
    matches5plus:     0,
    bestCombo:        0,
    robotsActivated:  0,
    synergiesActivated: { sensor: 0, titan: 0, vortex: 0, military: 0, industrial: 0 },
    headsCollected:   { vortex: 0, hammer: 0, laser: 0 },
    torsosCollected:  { sensor: 0, wild: 0, random: 0 },
    legsCollected:    { soldier: 0, scout: 0, titan: 0 },
    shuffles:         0,
  };
}

export class Game {
  private _state:    GameState;
  private _listeners: StateListener[] = [];
  private _busy       = false;
  private _cpuMode    = false;
  private _cpuTimer:  ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this._state = this._fresh();
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
      score:       0,
      level:       1,
      targetScore: LEVEL_TARGETS[1],
      combo:       0,
      message:     '',
      stats:       stats,
    };
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
      
      const move = findBestMove(this._state.board);
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
      this._patch({ phase: 'idle', message: 'No match!' });
      setTimeout(() => {
        this._patch({ message: '' });
        if (this._cpuMode) this._scheduleCpuMove();
      }, MESSAGE_TIMEOUT);
    } else {
      this._patchStats({ validMoves: this._state.stats.validMoves + 1 });
      this._resolveLoop(0);
    }
  }

  // ── Cascading resolve loop ────────────────────────────────────────────────
  private _resolveLoop(combo: number): void {
    const result = findMatches(this._state.board);

    if (result.positions.size === 0) {
      this._busy = false; // Reset busy first
      this._patch({ phase: 'idle', combo: 0, message: '' });
      this._checkLevelUp();
      this._checkDeadlock();
      if (this._cpuMode) this._scheduleCpuMove();
      return;
    }

    let gained = 0;
    const msgs: string[] = [];
    const s = this._state.stats;

    const multiplier = 1 + combo * 0.5;
    gained = Math.round(result.positions.size * SCORE_PER_PIECE * multiplier);

    // ── Check for "Pure Robot Match" Bonus ────────────────────────────────────
    const anyRegularCleared = Array.from(result.positions).some(k => {
      const [kr, kc] = k.split(',').map(Number);
      const piece = this._state.board[kr][kc];
      return piece && !isRobotPart(piece.type);
    });

    if (!anyRegularCleared && result.positions.size >= 3) {
      // PURE ROBOT MATCH! Huge score bonus
      gained += 1500;
      msgs.push('PURE ROBOT SYNERGY! +1500');
    }

    // Match quality stats
    const newBestCombo = Math.max(s.bestCombo, combo + 1);
    if      (result.has5plus)                          { this._patchStats({ matches5plus: s.matches5plus + 1, piecesCleared: s.piecesCleared + result.positions.size, bestCombo: newBestCombo }); msgs.push('5-IN-A-ROW!'); }
    else if (result.has4plusH || result.has4plusV)     { this._patchStats({ matches4:    s.matches4    + 1, piecesCleared: s.piecesCleared + result.positions.size, bestCombo: newBestCombo }); msgs.push('4-MATCH!'); }
    else                                               { this._patchStats({ matches3:    s.matches3    + 1, piecesCleared: s.piecesCleared + result.positions.size, bestCombo: newBestCombo }); }
    if (combo >= 2) msgs.push(`COMBO ×${combo}!`);

    // ── Apply Robot Powers ────────────────────────────────────────────────────
    for (const robotCombo of result.combos) {
      const rs = this._state.stats;
      applyComboRobotPower(this._state.board, robotCombo);
      
      const nextSynergies = { ...rs.synergiesActivated };
      if (robotCombo.synergy) {
        nextSynergies[robotCombo.synergy] = (nextSynergies[robotCombo.synergy] || 0) + 1;
        msgs.push(`${robotCombo.synergy.toUpperCase()} SYNERGY!`);
      }

      this._patchStats({ 
        robotsActivated: rs.robotsActivated + 1,
        synergiesActivated: nextSynergies,
        headsCollected:  { ...rs.headsCollected, [robotCombo.head]: rs.headsCollected[robotCombo.head] + 1 },
        torsosCollected: { ...rs.torsosCollected, [robotCombo.torso]: rs.torsosCollected[robotCombo.torso] + 1 },
        legsCollected:   { ...rs.legsCollected, [robotCombo.legs]: rs.legsCollected[robotCombo.legs] + 1 },
      });
      
      msgs.push(`ROBOT ACTIVATED: ${robotCombo.head}-${robotCombo.torso}-${robotCombo.legs}!`);
      gained += ROBOT_BONUS;
    }

    // ── Remove matched tiles ──────────────────────────────────────────────────
    const toClear: { r: number; c: number; progress: number; type: any }[] = [];
    for (const key of result.positions) {
      const [r, c] = key.split(',').map(Number);
      const piece = this._state.board[r][c];
      if (piece) {
        toClear.push({ r, c, progress: 0, type: piece.type });
      }
    }

    this._patch({ clearing: toClear, phase: 'animating' });

    // Animate Clear
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / CLEAR_ANIM_MS);
      this._patch({ clearing: toClear.map(c => ({ ...c, progress })) });
      if (progress < 1) requestAnimationFrame(tick);
      else {
        this._patch({ clearing: [] });
        
        // MAGNET MECHANIC: Find logic moves
        const magnetMoves = getMagnetMoves(this._state.board, result);
        
        // CAUTION: removeMatched must happen AFTER getMagnetMoves but BEFORE applyMagnetPull
        // so that the magnet pieces have a target (NULL) but haven't been cleared yet.
        removeMatched(this._state.board, result);

        if (magnetMoves.length > 0) {
          console.log('[Game] START MAGNET PULSE. Moves:', magnetMoves);
          msgs.push('MAGNET PULSE!');
          const startMagnet = performance.now();
          const toMagnet = magnetMoves.map(m => ({ 
            r: m.r, c: m.c, targetR: m.targetR, targetC: m.targetC, progress: 0, type: m.piece.type
          }));
          
          let lastProgress = -1;
          const tickMagnet = (nowM: number) => {
            const elapsedM = nowM - startMagnet;
            // SLOW & SMOOTH: Using a Sine-based ease-in-out for more deliberate motion
            const t = Math.min(1, elapsedM / MAGNET_ANIM_MS);
            const progressM = 0.5 - Math.cos(t * Math.PI) / 2; 
            
            if (progressM > lastProgress) {
              lastProgress = progressM;
              this._patch({ magnetizing: toMagnet.map(tm => ({ ...tm, progress: progressM })), phase: 'animating' });
            }
            
            if (t < 1) {
              requestAnimationFrame(tickMagnet);
            } else {
              console.log('[Game] MAGNET ANIM DONE. Executing moves:', magnetMoves);
              this._patch({ magnetizing: [] });
              
              // 1. Permanently update the board state with the new positions
              const success = applyMagnetPull(this._state.board, result, magnetMoves);
              console.log('[Game] applyMagnetPull success:', success);
              
              // 2. PAUSE before the next sequence
              // This lets the player process the movement before gravity/new matches kick in
              setTimeout(() => {
                this._animateFalling(combo, gained, msgs);
              }, 250); // Definitive 250ms pause
            }
          };
          requestAnimationFrame(tickMagnet);
        } else {
          this._animateFalling(combo, gained, msgs);
        }
      }
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
    if (level >= maxLevel || score < LEVEL_TARGETS[level]) return;

    const nextLevel  = level + 1;
    const nextTarget = LEVEL_TARGETS[Math.min(nextLevel, maxLevel)];
    
    this._busy = true; // Set busy before patching level change
    this._patch({ level: nextLevel, targetScore: nextTarget, message: `LEVEL ${nextLevel}!` });

    setTimeout(() => {
      this._state = { ...this._state, board: initBoard(), message: '', phase: 'idle' };
      this._emit();
      this._busy = false;
      if (this._cpuMode) this._scheduleCpuMove();
    }, 1600);
  }
}
