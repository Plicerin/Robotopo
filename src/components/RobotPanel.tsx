import { Tray } from '../game/types';
import { COLOR_HEX, COLOR_NAMES, COLOR_ATTACK } from '../game/constants';

interface Props {
  tray: Tray;
  phase?: string;
}

const SLOTS: Array<{ key: 'headColor' | 'torsoColor' | 'legsColor'; powerKey: 'headPower' | 'torsoPower' | 'legsPower'; label: string }> = [
  { key: 'headColor',  powerKey: 'headPower',  label: 'HEAD'  },
  { key: 'torsoColor', powerKey: 'torsoPower', label: 'TORSO' },
  { key: 'legsColor',  powerKey: 'legsPower',  label: 'LEGS'  },
];

export function RobotPanel({ tray, phase }: Props) {
  const parts    = SLOTS.map(s => tray[s.key]).filter(Boolean) as RobotColor[];
  const filled   = parts.length;
  const isReady  = filled === 3 || phase === 'assembling';
  
  // Average power level for UI
  const avgPower = Math.ceil(SLOTS.reduce((acc, s) => acc + tray[s.powerKey], 0) / Math.max(1, filled));

  // Majority color for UI glow/theme
  let themeColor = '#1e3a5f';
  if (filled > 0) {
    const counts: Record<string, number> = {};
    parts.forEach(c => counts[c] = (counts[c] || 0) + 1);
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    themeColor = COLOR_HEX[sorted[0][0] as RobotColor];
  }

  return (
    <div style={{
      width:        '160px',
      background:   '#060d18',
      border:       `1px solid ${themeColor}55`,
      borderRadius: '12px',
      padding:      '14px 12px',
      display:      'flex',
      flexDirection:'column',
      gap:          '10px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: themeColor }}>
        WORKBENCH {avgPower > 3 && <span style={{ color: '#FFD600' }}>★LV{avgPower-2}</span>}
      </div>

      {/* Assembly status */}
      <div style={{
        textAlign:    'center',
        fontSize:     '11px',
        fontWeight:   700,
        color:        filled > 0 ? themeColor : '#2a4060',
        background:   isReady ? `${themeColor}33` : filled > 0 ? `${themeColor}18` : '#0a1220',
        border:       `1px solid ${isReady ? themeColor : filled > 0 ? themeColor + '44' : '#1e3a5f'}`,
        borderRadius: '6px',
        padding:      '5px 0',
        letterSpacing:'1px',
        boxShadow:    isReady ? `0 0 10px ${themeColor}44` : 'none',
        animation:    isReady ? 'pulse 1.5s infinite ease-in-out' : 'none',
      }}>
        {filled === 0 ? '— empty —' : filled < 3 ? 'In Progress' : 'READY!'}
      </div>

      {/* 3 slots */}
      {SLOTS.map(({ key, powerKey, label }) => {
        const color = tray[key];
        const power = tray[powerKey];
        const hex = color ? COLOR_HEX[color] : '#1e3a5f';
        const done = !!color;
        return (
          <div key={key} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            background:   done ? `${hex}18` : '#0a1220',
            border:       `1px solid ${done ? hex + '66' : '#1e3a5f'}`,
            borderRadius: '8px',
            padding:      '8px 10px',
          }}>
            <div style={{
              width:        '10px',
              height:       '10px',
              borderRadius: '50%',
              background:   done ? hex : 'transparent',
              border:       `2px solid ${done ? hex : '#2a4060'}`,
              boxShadow:    done ? `0 0 6px ${hex}` : 'none',
              flexShrink:   0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: done ? hex : '#2a4060', letterSpacing: '1px' }}>
                {label}
              </span>
              {done && power > 3 && (
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#FFD600' }}>POWER {power}</span>
              )}
            </div>
            {done && (
              <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 800, color: hex }}>
                {COLOR_NAMES[color].substring(0, 3).toUpperCase()}
              </span>
            )}
          </div>
        );
      })}

      {/* Progress / attack hint */}
      <div style={{
        textAlign:    'center',
        fontSize:     '9px',
        color:        isReady ? themeColor : '#2a4060',
        lineHeight:   1.4,
        padding:      '6px 4px',
        borderTop:    '1px solid #1e3a5f',
      }}>
        {isReady 
          ? (() => {
              const majorityColor = parts.length > 0 ? parts.reduce((a, b) => 
                parts.filter(v => v === a).length >= parts.filter(v => v === b).length ? a : b
              ) : 'blue' as RobotColor; // Fallback during state reset animation
              const avgPower = Math.ceil((tray.headPower + tray.torsoPower + tray.legsPower) / 3);
              const bonus = parts.every(v => v === parts[0]) ? ' (ULTIMATE x2)' : '';
              
              let damageText = '';
              const count = avgPower > 5 ? Math.max(3, avgPower - 3) : Math.max(1, avgPower - 2);
              if (majorityColor === 'orange') damageText = `Clears ${count} most populated rows`;
              else if (majorityColor === 'blue') damageText = `Clears ${count} most populated columns`;
              else if (majorityColor === 'yellow') {
                const rad = avgPower > 5 ? Math.max(5, avgPower - 1) : Math.floor((count + 1) / 2);
                const size = rad * 2 + 1;
                damageText = `Clears ${size}x${size} area`;
              }
              else if (majorityColor === 'green') damageText = `Clears the ${count} most common colors`;
              else if (majorityColor === 'purple') damageText = `Clears ${15 + (count - 1) * 8} pieces inward`;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ color: themeColor, fontSize: '10px' }}>
                    READY: {COLOR_ATTACK[majorityColor]}
                  </strong>
                  <div style={{ 
                    background: themeColor + '22', 
                    color: '#fff', 
                    padding: '4px', 
                    borderRadius: '4px',
                    border: `1px solid ${themeColor}44`,
                    fontSize: '9px',
                    fontWeight: 600
                  }}>
                    {damageText}{bonus}
                  </div>
                </div>
              );
            })()
          : `${filled} / 3 parts collected`}
      </div>
    </div>
  );
}

