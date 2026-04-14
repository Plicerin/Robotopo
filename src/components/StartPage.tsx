import { useState } from 'react';
import { InstructionsPanel } from './InstructionsPanel';
import { SoundManager } from '../game/SoundManager';

const soundManager = new SoundManager();

interface Props {
  onStartOnePlayer: () => void;
  onStartCPU: () => void;
}

export function StartPage({ onStartOnePlayer, onStartCPU }: Props) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '30px',
      background: 'linear-gradient(135deg, #0a0f1f 0%, #1a1f3a 100%)',
      userSelect: 'none',
    }}>
      {showInstructions && (
        <InstructionsPanel onClose={() => setShowInstructions(false)} />
      )}

      {/* Logo */}
      <img
        src="/assets/Logo.png"
        alt="ROBOTOPO"
        style={{
          maxWidth: '400px',
          maxHeight: '250px',
          filter: 'drop-shadow(0 0 30px #42A5F588)',
          marginTop: '-10px',
        }}
      />

      {/* Subtitle */}
      <p style={{
        fontSize: '14px',
        color: '#88aabb',
        letterSpacing: '2px',
        margin: 0,
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        MATCH ROBOT PARTS · LAUNCH DEVASTATING ATTACKS · DOMINATE THE BOARD
      </p>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexDirection: 'column',
      }}>
        <button
          onClick={() => {
            soundManager.play('click');
            onStartOnePlayer();
          }}
          style={{
            padding: '18px 50px',
            background: 'linear-gradient(135deg, #42A5F533 0%, #1e3a5f 100%)',
            border: '2px solid #42A5F5',
            borderRadius: '10px',
            color: '#42A5F5',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
            boxShadow: '0 0 20px #42A5F544',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 35px #42A5F588';
            e.currentTarget.style.background = 'linear-gradient(135deg, #42A5F555 0%, #2a4a6f 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px #42A5F544';
            e.currentTarget.style.background = 'linear-gradient(135deg, #42A5F533 0%, #1e3a5f 100%)';
          }}
        >
          ONE PLAYER
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            onStartCPU();
          }}
          style={{
            padding: '18px 50px',
            background: 'linear-gradient(135deg, #66BB6A33 0%, #1a2a0a 100%)',
            border: '2px solid #66BB6A',
            borderRadius: '10px',
            color: '#66BB6A',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
            boxShadow: '0 0 20px #66BB6A44',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 35px #66BB6A88';
            e.currentTarget.style.background = 'linear-gradient(135deg, #66BB6A55 0%, #2a3a1a 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px #66BB6A44';
            e.currentTarget.style.background = 'linear-gradient(135deg, #66BB6A33 0%, #1a2a0a 100%)';
          }}
        >
          CPU PLAYER
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            setShowInstructions(true);
          }}
          style={{
            padding: '18px 50px',
            background: 'linear-gradient(135deg, #4488cc33 0%, #1e3a5f 100%)',
            border: '2px solid #4488cc',
            borderRadius: '10px',
            color: '#4488cc',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
            boxShadow: '0 0 20px #4488cc44',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 35px #4488cc88';
            e.currentTarget.style.background = 'linear-gradient(135deg, #4488cc55 0%, #2a4a6f 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px #4488cc44';
            e.currentTarget.style.background = 'linear-gradient(135deg, #4488cc33 0%, #1e3a5f 100%)';
          }}
        >
          INSTRUCTIONS
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
