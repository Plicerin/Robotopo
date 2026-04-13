import { useState, useEffect } from 'react';
import { GameStats, AllTimeRecord } from '../game/types';
import { VARIANT_COLORS, HEAD_VARIANTS, TORSO_VARIANTS, LEGS_VARIANTS, VARIANT_NAMES } from '../game/constants';

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

// ── Part variant mini-bar ───────────────────────────────────────────────────
function VariantBar({ variant, count }: { variant: string; count: number }) {
  const color = VARIANT_COLORS[variant];
  const name = VARIANT_NAMES[variant];

  return (
    <div style={{
      flex: 1,
      background: count > 0 ? color + '11' : '#0a1220',
      border: `1px solid ${count > 0 ? color + '44' : '#1a2d4a'}`,
      borderRadius: '6px',
      padding: '5px 6px',
      minWidth: '60px',
    }}>
      <div style={{
        fontSize: '7px',
        color: count > 0 ? color : '#3a5580',
        letterSpacing: '0.5px',
        marginBottom: '1px',
        textTransform: 'uppercase',
      }}>
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
        <Cell label="Combo Bot Activations" value={fmt(stats.robotsActivated)} accent="#FFD600" />
        <Cell label="Best combo"     value={stats.bestCombo > 0 ? `×${stats.bestCombo}` : '—'}
              accent="#FF6D00" isRecord={isBestCombo} />
      </Row>

      {/* ── SYNERGY MILSTONES ───────────────────────────────────────────── */}
      <SectionLabel>Active Synergies (Special Sets)</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {(['sensor', 'titan', 'vortex', 'military', 'industrial'] as const).map(syn => {
          const count = stats.synergiesActivated[syn] || 0;
          const isActive = count > 0;
          const colors: Record<string, string> = {
            sensor: '#66BB6A', titan: '#FF5252', vortex: '#9E9E9E', military: '#42A5F5', industrial: '#AB47BC'
          };
          return (
            <div key={syn} style={{
              flex: '1 1 80px',
              padding: '6px 8px',
              borderRadius: '6px',
              background: isActive ? colors[syn] + '22' : '#0a1220',
              border: `1px solid ${isActive ? colors[syn] : '#1a2d4a'}`,
              display: 'flex',
              flexDirection: 'column',
              opacity: isActive ? 1 : 0.5,
            }}>
              <div style={{ fontSize: '7px', fontWeight: 800, color: colors[syn], marginBottom: '1px' }}>{syn.toUpperCase()}</div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: isActive ? '#fff' : '#2a3a50' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* ── Row 3: Part Usage ──────────────────────────────────────────── */}
      <SectionLabel>Parts Collected (Variants)</SectionLabel>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '7px', color: '#335588', fontWeight: 800, marginBottom: '3px' }}>HEADS</div>
        <Row>
          {HEAD_VARIANTS.map(v => <VariantBar key={v} variant={v} count={stats.headsCollected[v] || 0} />)}
        </Row>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '7px', color: '#335588', fontWeight: 800, marginBottom: '3px' }}>TORSOS</div>
        <Row>
          {TORSO_VARIANTS.map(v => <VariantBar key={v} variant={v} count={stats.torsosCollected[v] || 0} />)}
        </Row>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '7px', color: '#335588', fontWeight: 800, marginBottom: '3px' }}>LEGS</div>
        <Row>
          {LEGS_VARIANTS.map(v => <VariantBar key={v} variant={v} count={stats.legsCollected[v] || 0} />)}
        </Row>
      </div>

      {/* ── Row 4: Records ─────────────────────────────────────────────── */}
      <SectionLabel>All-time records</SectionLabel>
      <Row>
        <Cell label="Games played"    value={fmt(records.gamesPlayed)}                                   accent="#42A5F5" />
        <Cell label="High score"      value={fmt(records.highScore)}           accent="#FFD600" isRecord={isHighScore} />
        <Cell label="Best combo"      value={records.bestCombo > 0 ? `×${records.bestCombo}` : '—'}  accent="#FF6D00" />
        <Cell label="Most bots"     value={fmt(records.mostRobotsOneGame)}   sub="in one game" />
      </Row>

      <Row>
        <Cell label="Total pieces"    value={fmt(records.totalPiecesCleared)}  />
        <Cell label="Total robots"    value={fmt(records.totalRobots)}         accent="#AB47BC" />
      </Row>
    </div>
  );
}
