import { useState } from 'react';
import { LogEntry } from '../game/types';

interface Props {
  logs: LogEntry[];
}

export function LogPanel({ logs }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      width: '600px',
      maxWidth: '90vw',
      background: '#0a1220',
      border: '1px solid #1e3a5f',
      borderRadius: '8px 8px 0 0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      transition: 'transform 0.3s ease, height 0.3s ease',
      transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 44px))',
      height: isOpen ? '70vh' : '44px',
      position: 'fixed',
      bottom: 0,
      left: '50%',
      marginLeft: '-300px',
      zIndex: 1000,
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px',
          background: '#16243a',
          borderBottom: isOpen ? '1px solid #1e3a5f' : 'none',
          fontSize: '11px',
          fontWeight: 800,
          color: '#4488cc',
          letterSpacing: '1px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1a2a4a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#16243a';
        }}
      >
        <span>BATTLE LOG</span>
        <span style={{
          fontSize: '14px',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▲
        </span>
      </div>
      {isOpen && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {logs.length === 0 && (
            <div style={{ color: '#2a4060', fontSize: '10px', textAlign: 'center', marginTop: '20px' }}>
              No logs yet...
            </div>
          )}
          {logs.map(log => (
            <div key={log.id} style={{
              padding: '8px',
              background: log.type === 'robot' ? 'rgba(255, 214, 0, 0.05)' : 'rgba(68, 136, 204, 0.03)',
              borderLeft: `3px solid ${log.type === 'robot' ? '#FFD600' : '#4488cc'}`,
              borderRadius: '4px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: log.type === 'robot' ? '#FFD600' : '#4488cc',
                marginBottom: '2px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{log.title}</span>
                <span style={{ fontSize: '8px', opacity: 0.5 }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: '#88aabb', lineHeight: 1.3 }}>
                {log.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
