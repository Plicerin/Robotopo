import { useState, useEffect } from 'react';
import { Game } from './game/Game';
import { GameState, AllTimeRecord } from './game/types';
import { GameCanvas } from './components/GameCanvas';
import { RobotPanel } from './components/RobotPanel';
import { StatsPanel } from './components/StatsPanel';
import { LEVEL_TARGETS } from './game/constants';
import { loadRecords } from './game/Records';
import { CANVAS_W } from './game/Renderer';

const game = new Game();

// Board canvas width + gap + robot panel width  (must match layout widths below)
const ROBOT_PANEL_W = 180;
const GAP           = 18;
const STATS_WIDTH   = CANVAS_W + GAP + ROBOT_PANEL_W;

export default function App() {
  const [state, setState]     = useState<GameState>(game.state);
  const [cpuMode, setCpuState] = useState(false);
  const [records, setRecords]  = useState<AllTimeRecord>(() => loadRecords());

  useEffect(() => {
    const unsub = game.subscribe(setState);
    return unsub;
  }, []);

  // Persist records on tab/window close
  useEffect(() => {
    const onUnload = () => { game.commitAndRestart(); };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  function toggleCpu() {
    const next = !cpuMode;
    setCpuState(next);
    game.setCpuMode(next);
  }

  function handleNewGame() {
    game.commitAndRestart();
    setRecords(loadRecords());
  }

  const levelIdx   = Math.min(state.level, LEVEL_TARGETS.length - 1);
  const prevTarget = LEVEL_TARGETS[levelIdx - 1] ?? 0;
  const curTarget  = LEVEL_TARGETS[levelIdx];
  const progress   = Math.min(1, (state.score - prevTarget) / Math.max(1, curTarget - prevTarget));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', userSelect: 'none' }}>

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, letterSpacing: '5px', color: '#42A5F5', textShadow: '0 0 20px #42A5F566' }}>
        ROBOTOPO
      </h1>

      {/* ── Score bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#080f1c', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '8px 20px' }}>
        <StatBox label="SCORE" value={state.score.toLocaleString()} />
        <Divider />
        <StatBox label="LEVEL" value={String(state.level)} />
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#4466aa', letterSpacing: '1px', marginBottom: '4px' }}>NEXT LEVEL</div>
          <div style={{ width: '110px', height: '7px', background: '#1e3a5f', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg,#42A5F5,#AB47BC)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: '8px', color: '#4466aa', marginTop: '2px' }}>
            {state.score.toLocaleString()} / {curTarget.toLocaleString()}
          </div>
        </div>
        {state.combo > 1 && (
          <div style={{ color: '#FFD600', fontWeight: 700, fontSize: '13px', textShadow: '0 0 10px #FFD60088' }}>
            COMBO ×{state.combo}
          </div>
        )}
        {cpuMode && (
          <div style={{ padding: '3px 10px', borderRadius: '5px', background: '#0a1a0a', border: '1px solid #66BB6A88', color: '#66BB6A', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', boxShadow: '0 0 8px #66BB6A44' }}>
            CPU
          </div>
        )}
      </div>

      {/* ── Board + Robot legend ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
        <GameCanvas game={game} state={state} />
        <RobotPanel />
      </div>

      {/* ── Stats panel ─────────────────────────────────────────────────────── */}
      <StatsPanel
        stats={state.stats}
        score={state.score}
        records={records}
        width={STATS_WIDTH}
      />

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ fontSize: '9px', color: '#2a4060', letterSpacing: '0.5px' }}>
          {cpuMode
            ? 'CPU is playing — watch it align robot parts!'
            : 'Swap adjacent pieces to match 3+ · Match 3 of the same robot\'s parts in any line to activate it'}
        </div>
        <button
          onClick={toggleCpu}
          style={{ padding: '5px 16px', background: cpuMode ? '#1a2a0a' : 'transparent', border: `1px solid ${cpuMode ? '#66BB6A' : '#1e3a5f'}`, borderRadius: '6px', color: cpuMode ? '#66BB6A' : '#4488cc', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 700, boxShadow: cpuMode ? '0 0 10px #66BB6A44' : 'none', transition: 'all 0.2s ease' }}
        >
          {cpuMode ? 'CPU ON' : 'CPU OFF'}
        </button>
        <button
          onClick={handleNewGame}
          style={{ padding: '5px 16px', background: 'transparent', border: '1px solid #1e3a5f', borderRadius: '6px', color: '#4488cc', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 600 }}
        >
          NEW GAME
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '8px', color: '#4466aa', letterSpacing: '1.5px', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#e0e8ff' }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: '1px', height: '28px', background: '#1e3a5f' }} />;
}
