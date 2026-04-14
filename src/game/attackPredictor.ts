import { RobotColor } from './types';

export interface AttackPrediction {
  count: number;
  description: string;
}

/**
 * Predict robot attack scope based on color and power level.
 * This matches the formula used in Board.ts computeRobotAttack().
 */
export function predictRobotAttack(color: RobotColor, power: number): AttackPrediction {
  // Ultimate robots (power > 5 due to 2x bonus) get a massive count boost
  const count = power > 5 ? Math.max(3, power - 3) : Math.max(1, power - 2);

  const descriptions: Record<RobotColor, string> = {
    orange: `Clears ${count} most populated rows`,
    blue: `Clears ${count} most populated columns`,
    yellow: (() => {
      const rad = power > 5 ? Math.max(5, power - 1) : Math.floor((count + 1) / 2);
      const size = rad * 2 + 1;
      return `Clears ${size}×${size} area`;
    })(),
    green: `Clears the ${count} most common colors`,
    magenta: `Clears ${15 + (count - 1) * 8} pieces inward`,
  };

  return {
    count,
    description: descriptions[color],
  };
}
