import { LogEntry } from '../game/types';

interface Props {
  logs: LogEntry[];
}

export function LogPanel({ logs }: Props) {
  return (
    <div style={{
      width: '280px',
      height: '400px',
      background: '#0a1220',
      border: '1px solid #1e3a5f',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        padding: '10px',
        background: '#16243a',
        borderBottom: '1px solid #1e3a5f',
        fontSize: '11px',
        fontWeight: 800,
        color: '#4488cc',
        letterSpacing: '1px'
      }}>
        BATTLE LOG
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
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
    </div>
  );
}
