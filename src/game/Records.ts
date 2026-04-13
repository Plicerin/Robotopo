import { AllTimeRecord, GameStats } from './types';

const KEY = 'roborock-records-v1';

const EMPTY: AllTimeRecord = {
  highScore:          0,
  bestCombo:          0,
  mostRobotsOneGame:  0,
  gamesPlayed:        0,
  totalPiecesCleared: 0,
  totalRobots:        0,
};

export function loadRecords(): AllTimeRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* ignore parse errors */ }
  return { ...EMPTY };
}

export function saveRecords(rec: AllTimeRecord): void {
  try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* storage full etc. */ }
}

/** Merge the just-finished game into the all-time record and persist it. */
export function commitGame(score: number, stats: GameStats): AllTimeRecord {
  const cur = loadRecords();
  const next: AllTimeRecord = {
    highScore:          Math.max(cur.highScore,         score),
    bestCombo:          Math.max(cur.bestCombo,         stats.bestCombo),
    mostRobotsOneGame:  Math.max(cur.mostRobotsOneGame, stats.robotsActivated),
    gamesPlayed:        cur.gamesPlayed + 1,
    totalPiecesCleared: cur.totalPiecesCleared + stats.piecesCleared,
    totalRobots:        cur.totalRobots        + stats.robotsActivated,
  };
  saveRecords(next);
  return next;
}
