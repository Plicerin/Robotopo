import { ReactNode } from 'react';
import { VARIANT_COLORS, VARIANT_NAMES, VARIANT_DESCRIPTIONS, HEAD_VARIANTS, TORSO_VARIANTS, LEGS_VARIANTS, ARM_VARIANTS } from '../game/constants';

function VariantItem({ variant, type }: { variant: string, type: 'HEAD' | 'TORSO' | 'LEGS' | 'ARM' }): ReactNode {
  const color = VARIANT_COLORS[variant];

  return (
    <div style={{
      background:   '#0a1220',
      border:       `1px solid ${color}44`,
      borderRadius: '8px',
      padding:      '8px',
      marginBottom: '6px',
      display:      'flex',
      flexDirection: 'column',
      gap:          '4px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }}/>
        <span style={{ fontWeight: 700, fontSize: '10px', color: '#fff', letterSpacing: '0.5px' }}>
          {VARIANT_NAMES[variant]}
        </span>
        <span style={{ fontSize: '8px', color: color, fontWeight: 800, marginLeft: 'auto' }}>{type}</span>
      </div>
      <div style={{ fontSize: '9px', color: '#4466aa', lineHeight: 1.3 }}>
        {VARIANT_DESCRIPTIONS[variant]}
      </div>
    </div>
  );
}

export function RobotPanel() {
  return (
    <div style={{
      // ... (style stays same)
    }}>
      <div style={{
        textAlign:     'center',
        fontSize:      '11px',
        fontWeight:    700,
        letterSpacing: '2px',
        color:         '#3366aa',
        marginBottom:  '16px',
        textTransform: 'uppercase',
      }}>
        Robot Assembly
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#3366aa', marginBottom: '8px', borderBottom: '1px solid #1e3a5f', paddingBottom: '4px' }}>HEADS: DAMAGE MODE</div>
        {HEAD_VARIANTS.map(v => <VariantItem key={v} variant={v} type="HEAD" />)}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#3366aa', marginBottom: '8px', borderBottom: '1px solid #1e3a5f', paddingBottom: '4px' }}>TORSOS: TARGETING</div>
        {TORSO_VARIANTS.map(v => <VariantItem key={v} variant={v} type="TORSO" />)}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#3366aa', marginBottom: '8px', borderBottom: '1px solid #1e3a5f', paddingBottom: '4px' }}>ARMS: EXTRA STRIKES</div>
        {ARM_VARIANTS.map(v => <VariantItem key={v} variant={v} type="ARM" />)}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#3366aa', marginBottom: '8px', borderBottom: '1px solid #1e3a5f', paddingBottom: '4px' }}>LEGS: SCALE</div>
        {LEGS_VARIANTS.map(v => <VariantItem key={v} variant={v} type="LEGS" />)}
      </div>

      <div style={{
        marginTop:  '10px',
        padding:    '10px',
        background: '#0a1525',
        borderRadius: '7px',
        border:     '1px solid #1e3a5f88',
      }}>
        <div style={{ fontSize: '10px', color: '#5577cc', lineHeight: 1.6, textAlign: 'center' }}>
          <strong style={{ color: '#7799ff', display: 'block', marginBottom: '4px' }}>COMBO RULE</strong>
          Stack Head/Torso/Legs vertically. Add <strong>Arms</strong> to the left or right of the Torso for extra damage. 
          <br/>
          <span style={{ color: '#ffaa00' }}>Both arms = SUPER ATTACK!</span>
        </div>
      </div>
    </div>
  );
}
