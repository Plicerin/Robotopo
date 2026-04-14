import { Piece, PieceType, getColor } from './types';
import { BOARD_ROWS, BOARD_COLS } from './constants';

/**
 * Manual Test Helper: Allows triggering specific board states or robot events via Console.
 * Access this in DevTools via `window.debugRobot(color, power)`
 */
export class DebugTools {
  constructor(private game: any) {
    (window as any).debugRobot = (color: string, power: number = 3) => {
      this.triggerManualRobot(color, power);
    };
    
    (window as any).fillColumn = (col: number, color: string) => {
        this.fillColumn(col, color);
    };

    console.log("🛠️ Robotopo Debug Tools loaded.");
    console.log("   - window.debugRobot('blue', 6)  // Trigger ultimate blue");
    console.log("   - window.fillColumn(0, 'magenta') // Fill first col with magenta parts");
  }

  private triggerManualRobot(color: string, power: number) {
    console.log(`Debug: Forcing ${color} robot with power ${power}`);
    this.game.debugForceRobot(color, power);
  }

  private fillColumn(col: number, color: any) {
    const board = [...this.game.state.board];
    for (let r = 0; r < BOARD_ROWS; r++) {
      const type = (r % 3 === 0 ? 'head' : r % 3 === 1 ? 'torso' : 'legs');
      board[r][col] = {
        id: Math.random(),
        type: `${color}-${type}` as PieceType,
        row: r,
        col: col,
        power: 3
      };
    }
    this.game._patch({ board });
  }
}
