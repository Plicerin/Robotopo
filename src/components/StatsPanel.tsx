import { useState, useEffect } from 'react';
import { GameStats, AllTimeRecord } from '../game/types';
import { COLOR_HEX, COLOR_NAMES, ROBOT_COLORS } from '../game/constants';

interface Props {
  stats:   GameStats;
  score:   number;
  records: AllTimeRecord;
  width:   number; // match board + robot panel width
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function fmt(n: number): string { return n.toLocaleString(); }

function pct(a: number, b: number): string {
  if (b === 0) return '—';
  return `${Math.round((a / b) * 100)}%`;
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

function Cell({
  label, value, sub, accent, isRecord,
}: {
  label:    string;
  value:    string;
  sub?:     string;
  accent?:  string;
  isRecord?: boolean;
}) {
  return (
    <div style={{
      background:   '#0a1220',
      border:       `1px solid ${isRecord ? '#FFD600' : '#1a2d4a'}`,
      borderRadius: '8px',
      padding:      '8px 10px',
      minWidth:     '80px',
      boxShadow:    isRecord ? '0 0 8px #FFD60033' : 'none',
      flex:         1,
    }}>
      <div style={{ fontSize: '8px', color: '#3a5580', letterSpacing: '1.2px', marginBottom: '3px', textTransform: 'uppercase' }}>
        {label}
        {isRecord && <span style={{ color: '#FFD600', marginLeft: '4px' }}>★</span>}
      </div>
      <div style={{ fontSize: '17px', fontWeight: 700, color: accent ?? '#c8d8f0', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '9px', color: '#3a5580', marginTop: '2px' }}>{sub}</div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '9px', fontWeight: 700, color: '#2a4060', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' }}>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
      {children}
    </div>
  );
}

// ── Color robot mini-bar ──────────────────────────────────────────────────────
function ColorBar({ color, count }: { color: string; count: number }) {
  const hex = COLOR_HEX[color as keyof typeof COLOR_HEX];
  const name = COLOR_NAMES[color as keyof typeof COLOR_NAMES];
  return (
    <div style={{
      flex: 1,
      background: count > 0 ? hex + '11' : '#0a1220',
      border: `1px solid ${count > 0 ? hex + '44' : '#1a2d4a'}`,
      borderRadius: '6px',
      padding: '5px 6px',
      minWidth: '52px',
    }}>
      <div style={{ fontSize: '7px', color: count > 0 ? hex : '#3a5580', letterSpacing: '0.5px', marginBottom: '1px', textTransform: 'uppercase' }}>
        {name}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: count > 0 ? '#fff' : '#2a3a50' }}>
        {count}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StatsPanel({ stats, score, records, width }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed      = Math.max(0, Math.floor((now - stats.startTime) / 1000));
  const scorePerMin  = elapsed > 0 ? Math.round((score * 60) / elapsed) : 0;
  const accuracy     = pct(stats.validMoves, stats.movesAttempted);
  const isHighScore  = score > 0 && score >= records.highScore;
  const isBestCombo  = stats.bestCombo > 0 && stats.bestCombo >= records.bestCombo;

  return (
    <div style={{
      width,
      background:   '#070d1a',
      border:       '1px solid #1a2d4a',
      borderRadius: '12px',
      padding:      '12px 14px',
    }}>

      {/* ── Row 1: Session ─────────────────────────────────────────────── */}
      <SectionLabel>Session</SectionLabel>
      <Row>
        <Cell label="Time"      value={fmtTime(elapsed)} accent="#42A5F5" />
        <Cell label="Moves"     value={fmt(stats.movesAttempted)} sub={`${fmt(stats.validMoves)} valid`} />
        <Cell label="Accuracy"  value={accuracy} sub="valid / tried" />
        <Cell label="Score/min" value={fmt(scorePerMin)} sub="efficiency" accent="#AB47BC" />
      </Row>

      {/* ── Row 2: Matches ─────────────────────────────────────────────── */}
      <SectionLabel>Matches & Hits</SectionLabel>
      <Row>
        <Cell label="Pieces cleared" value={fmt(stats.piecesCleared)} />
        <Cell label="3-matches"      value={fmt(stats.matches3)} />
        <Cell label="Robots launched" value={fmt(stats.robotsLaunched)} accent="#FFD600" />
        <Cell label="Best combo"     value={stats.bestCombo > 0 ? `×${stats.bestCombo}` : '—'}
              accent="#FF6D00" isRecord={isBestCombo} />
      </Row>

      {/* ── Row 3: Robots by color ──────────────────────────────────────── */}
      <SectionLabel>Robots by Color</SectionLabel>
      <Row>
        {ROBOT_COLORS.map(c => <ColorBar key={c} color={c} count={stats.robotsByColor[c] || 0} />)}
      </Row>

      {/* ── Row 4: Records ─────────────────────────────────────────────── */}
      <SectionLabel>All-time records</SectionLabel>
      <Row>
        <Cell label="Games played"  value={fmt(records.gamesPlayed)}                                  accent="#42A5F5" />
        <Cell label="High score"    value={fmt(records.highScore)}          accent="#FFD600" isRecord={isHighScore} />
        <Cell label="Best combo"    value={records.bestCombo > 0 ? `×${records.bestCombo}` : '—'} accent="#FF6D00" />
        <Cell label="Most robots"   value={fmt(records.mostRobotsOneGame)}  sub="in one game" />
      </Row>
      <Row>
        <Cell label="Total pieces"  value={fmt(records.totalPiecesCleared)} />
        <Cell label="Total robots"  value={fmt(records.totalRobots)}        accent="#AB47BC" />
      </Row>
    </div>
  );
}
