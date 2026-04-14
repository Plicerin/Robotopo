import { Tray, RobotColor } from '../game/types';
import { COLOR_HEX, COLOR_NAMES, COLOR_ATTACK } from '../game/constants';
import { predictRobotAttack } from '../game/attackPredictor';

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

  const getPartName = (key: string) => {
    if (key === 'headColor') return 'head';
    if (key === 'torsoColor') return 'torso';
    return 'legs';
  };

  return (
    <div style={{
      width:        '144px',
      background:   'rgba(6, 13, 24, 0.8)',
      border:       `2px solid ${themeColor}cc`,
      borderRadius: '12px',
      padding:      '10px 8px',
      display:      'flex',
      flexDirection:'column',
      gap:          '8px',
      alignItems:   'center',
      boxShadow:    `0 0 20px ${themeColor}44`,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 800, letterSpacing: '2px', color: themeColor }}>
        ASSEMBLY {avgPower > 3 && <span style={{ color: '#FFD600' }}>LV{avgPower-2}</span>}
      </div>

      {/* Status indicator */}
      <div style={{
        width:       '6px',
        height:      '6px',
        borderRadius:'50%',
        background:  isReady ? '#FFD600' : filled > 0 ? themeColor : '#2a4060',
        boxShadow:   isReady ? `0 0 8px #FFD600` : filled > 0 ? `0 0 4px ${themeColor}` : 'none',
        animation:   isReady ? 'pulse 1.5s infinite ease-in-out' : 'none',
      }} />

      {/* Robot stack visualization - parts from top to bottom */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '-2px',
        alignItems:    'center',
        justifyContent:'center',
      }}>
        {SLOTS.map(({ key, powerKey }, idx) => {
          const color = tray[key];
          const power = tray[powerKey];
          const hex = color ? COLOR_HEX[color] : '#1e3a5f';
          const done = !!color;
          const partName = getPartName(key);

          return (
            <div key={key} style={{
              position:       'relative',
              marginTop:      idx > 0 ? '-6px' : '0',
              width:          '56px',
              height:         '56px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              border:         done ? `3px solid ${hex}` : '3px solid #4488cc',
              borderRadius:   '8px',
              background:     done ? `${hex}22` : '#1e3a5f33',
              boxShadow:      done ? `0 0 8px ${hex}66` : 'inset 0 0 8px #4488cc22',
            }}>
              <img
                src={`/assets/${color || 'blue'}_${partName}.png`}
                alt={partName}
                style={{
                  width:      '48px',
                  height:     '48px',
                  objectFit:  'contain',
                  opacity:    done ? 1 : 0.2,
                  filter:     done
                    ? `drop-shadow(0 0 6px ${hex})`
                    : `brightness(0.4) saturate(0)`,
                  transition: 'opacity 0.3s, filter 0.3s',
                  pointerEvents: 'none',
                }}
              />
              {done && power > 3 && (
                <div style={{
                  position:   'absolute',
                  bottom:     '2px',
                  right:      '2px',
                  fontSize:   '7px',
                  fontWeight: 800,
                  color:      '#FFD600',
                  background:'#1a1a1a',
                  padding:    '1px 3px',
                  borderRadius:'2px',
                  border:     '1px solid #FFD600',
                }}>
                  P{power}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress info */}
      <div style={{
        textAlign:    'center',
        fontSize:     '8px',
        color:        filled > 0 ? themeColor : '#2a4060',
        padding:      '4px 4px',
        borderTop:    '1px solid #1e3a5f',
        width:        '100%',
      }}>
        {filled === 0 && '0 / 3 parts'}
        {filled === 1 && '1 / 3 parts'}
        {filled === 2 && '2 / 3 parts'}
        {filled === 3 && isReady && '✓ READY'}
      </div>

      {/* Attack hint when ready */}
      {isReady && (() => {
        const majorityColor = parts.length > 0 ? parts.reduce((a, b) =>
          parts.filter(v => v === a).length >= parts.filter(v => v === b).length ? a : b
        ) : 'blue' as RobotColor;

        // Calculate final power (average of 3 parts, with 2x bonus if ultimate)
        const basePower = Math.ceil((tray.headPower + tray.torsoPower + tray.legsPower) / 3);
        const isUltimate = parts.every(v => v === parts[0]);
        const finalPower = isUltimate ? basePower * 2 : basePower;

        const prediction = predictRobotAttack(majorityColor, finalPower);
        const bonus = isUltimate ? '★ULTIMATE x2' : '';

        return (
          <div style={{
            fontSize:     '7px',
            fontWeight:   700,
            color:        '#FFD600',
            textAlign:    'center',
            padding:      '3px',
            background:   themeColor + '22',
            borderRadius: '4px',
            width:        '100%',
            border:       `1px solid ${themeColor}44`,
            lineHeight:   '1.2',
          }}>
            {prediction.description}
            {bonus && <div>{bonus}</div>}
          </div>
        );
      })() }
    </div>
  );
}

