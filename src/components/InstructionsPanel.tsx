interface Props {
  onClose: () => void;
}

export function InstructionsPanel({ onClose }: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0f1f 0%, #1a1f3a 100%)',
        border: '2px solid #42A5F5',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 0 40px #42A5F588',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: '1px solid #42A5F5',
            color: '#42A5F5',
            fontSize: '24px',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#42A5F522';
            e.currentTarget.style.boxShadow = '0 0 15px #42A5F55';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ×
        </button>

        {/* Title */}
        <h1 style={{ color: '#42A5F5', fontSize: '32px', marginTop: 0, marginBottom: '30px', letterSpacing: '3px' }}>
          HOW TO PLAY
        </h1>

        {/* Section 1: Basic Gameplay */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>OBJECTIVE</h2>
          <p style={{ color: '#88aabb', fontSize: '14px', lineHeight: '1.6' }}>
            Match 3 or more pieces of the same color in a line to clear them from the board. Collect robot parts (head, torso, legs) of the same color to assemble robots and launch powerful attacks!
          </p>
        </div>

        {/* Section 2: Matching */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>MATCHING PIECES</h2>
          <p style={{ color: '#88aabb', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
            Swap adjacent pieces by clicking them. If they form a match of 3 or more in a line, they clear from the board!
          </p>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#0a1220', padding: '15px', borderRadius: '8px' }}>
            <div>
              <p style={{ color: '#4488cc', fontSize: '12px', marginTop: 0, marginBottom: '10px' }}>Match 3+</p>
              <p style={{ color: '#88aabb', fontSize: '14px', margin: 0 }}>3-in-a-row clears pieces</p>
            </div>
            <div>
              <p style={{ color: '#FFD600', fontSize: '12px', marginTop: 0, marginBottom: '10px' }}>4-IN-A-ROW</p>
              <p style={{ color: '#88aabb', fontSize: '14px', margin: 0 }}>Extra points & power!</p>
            </div>
            <div>
              <p style={{ color: '#AB47BC', fontSize: '12px', marginTop: 0, marginBottom: '10px' }}>5-IN-A-ROW</p>
              <p style={{ color: '#88aabb', fontSize: '14px', margin: 0 }}>Maximum combo damage</p>
            </div>
          </div>
        </div>

        {/* Section 3: Robot Parts */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>ROBOT PARTS</h2>
          <p style={{ color: '#88aabb', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            When you match pieces, they fill the workbench. Collect all 3 parts (head, torso, legs) to assemble a robot!
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', alignItems: 'flex-start', background: '#0a1220', padding: '20px', borderRadius: '8px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <img src="/assets/blue_head.png" alt="head" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
              <p style={{ color: '#88aabb', fontSize: '12px', margin: 0 }}>HEAD</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src="/assets/blue_torso.png" alt="torso" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
              <p style={{ color: '#88aabb', fontSize: '12px', margin: 0 }}>TORSO</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src="/assets/blue_legs.png" alt="legs" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
              <p style={{ color: '#88aabb', fontSize: '12px', margin: 0 }}>LEGS</p>
            </div>
          </div>
        </div>

        {/* Section 4: Workbench */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>THE WORKBENCH</h2>
          <p style={{ color: '#88aabb', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
            The workbench shows your progress toward assembling a robot. Empty slots show as outlines, filled slots glow with their color. The preview below shows what attack is ready!
          </p>
          <div style={{ background: '#0a1220', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#4488cc', fontSize: '12px', marginTop: 0 }}>WORKBENCH EXAMPLE</p>
            <div style={{
              width: '144px',
              background: '#060d18',
              border: '1px solid #42A5F555',
              borderRadius: '12px',
              padding: '10px 8px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#42A5F5', letterSpacing: '2px' }}>
                ASSEMBLY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '-2px', alignItems: 'center' }}>
                <img src="/assets/blue_head.png" alt="head" style={{ width: '56px', height: '56px', filter: 'drop-shadow(0 0 4px #42A5F5)' }} />
                <div style={{ border: '2px dashed #2a4060', width: '56px', height: '56px', borderRadius: '6px', opacity: 0.3, marginTop: '-6px' }} />
                <div style={{ border: '2px dashed #2a4060', width: '56px', height: '56px', borderRadius: '6px', opacity: 0.3, marginTop: '-6px' }} />
              </div>
              <div style={{ fontSize: '8px', color: '#42A5F5', padding: '4px', borderTop: '1px solid #1e3a5f', width: '100%' }}>
                1 / 3 parts
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Robot Attacks */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>ROBOT ATTACKS</h2>
          <p style={{ color: '#88aabb', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
            Each robot color has a unique attack! The majority color of your 3 parts determines which attack launches:
          </p>
          <div style={{ background: '#0a1220', padding: '15px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#42A5F5', fontSize: '13px', fontWeight: 700, margin: 0 }}>🔵 BLUE ROBOT — Piercing Beam</p>
              <p style={{ color: '#88aabb', fontSize: '12px', margin: '5px 0 0 0' }}>Clears the most populated columns</p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#FFD600', fontSize: '13px', fontWeight: 700, margin: 0 }}>🟠 ORANGE ROBOT — Inferno</p>
              <p style={{ color: '#88aabb', fontSize: '12px', margin: '5px 0 0 0' }}>Clears the most populated rows</p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#FFEB3B', fontSize: '13px', fontWeight: 700, margin: 0 }}>🟡 YELLOW ROBOT — Pulse Blast</p>
              <p style={{ color: '#88aabb', fontSize: '12px', margin: '5px 0 0 0' }}>Clears a square area around the center</p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#66BB6A', fontSize: '13px', fontWeight: 700, margin: 0 }}>🟢 GREEN ROBOT — Chain Virus</p>
              <p style={{ color: '#88aabb', fontSize: '12px', margin: '5px 0 0 0' }}>Clears all pieces matching common colors</p>
            </div>
            <div>
              <p style={{ color: '#EA80FC', fontSize: '13px', fontWeight: 700, margin: 0 }}>🟣 MAGENTA ROBOT — Gravity Well</p>
              <p style={{ color: '#88aabb', fontSize: '12px', margin: '5px 0 0 0' }}>Clears pieces from edges moving inward</p>
            </div>
          </div>
        </div>

        {/* Section 6: Ultimate Robots */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>ULTIMATE ROBOTS ⭐</h2>
          <p style={{ color: '#88aabb', fontSize: '14px', lineHeight: '1.6' }}>
            Assemble all 3 parts in the SAME COLOR for an ULTIMATE ROBOT! Your attack power doubles, dealing massive damage to the board. The more power you accumulate, the stronger your attack!
          </p>
        </div>

        {/* Section 7: Tips */}
        <div>
          <h2 style={{ color: '#FFD600', fontSize: '20px', marginTop: 0 }}>PRO TIPS</h2>
          <ul style={{ color: '#88aabb', fontSize: '13px', lineHeight: '1.8' }}>
            <li>🎯 Plan ahead — combos are rewarded with bonus points and faster robot assembly</li>
            <li>⚡ Higher Power levels = stronger attacks. Match pieces with high power values</li>
            <li>🎨 Match different colors while building toward an Ultimate for flexibility in attacks</li>
            <li>🔄 The board shuffles when you run out of moves — use that to your advantage</li>
            <li>📊 Watch the Battle Log to see your attack history and plan your next moves</li>
          </ul>
        </div>

        {/* Close button at bottom */}
        <button
          onClick={onClose}
          style={{
            marginTop: '30px',
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #42A5F533 0%, #1e3a5f 100%)',
            border: '2px solid #42A5F5',
            borderRadius: '8px',
            color: '#42A5F5',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '2px',
            transition: 'all 0.3s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #42A5F555 0%, #2a4a6f 100%)';
            e.currentTarget.style.boxShadow = '0 0 20px #42A5F588';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #42A5F533 0%, #1e3a5f 100%)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          GOT IT!
        </button>
      </div>
    </div>
  );
}
