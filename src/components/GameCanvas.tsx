import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';
import { GameState } from '../game/types';
import { render, pixelToCell, CANVAS_W, CANVAS_H } from '../game/Renderer';

interface Props {
  game: Game;
  state: GameState;
}

export function GameCanvas({ game, state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Re-render whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    render(canvas, state);
  }, [state]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top)  * scaleY;
    const pos = pixelToCell(px, py);
    if (pos) game.handleClick(pos);
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        borderRadius: '10px',
        boxShadow: '0 0 40px #1e3a5f88, 0 0 80px #0d1b2a',
        display: 'block',
        maxWidth: '100%',
      }}
    />
  );
}
