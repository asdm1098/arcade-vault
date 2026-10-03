export interface GameStats {
  score: number;
  lives: number;
  level: number;
}

export interface GameCallbacks {
  onStats: (stats: GameStats) => void; // al cambiar score, vidas o nivel
  onGameOver: (finalScore: number) => void; // una vez, al quedarse sin vidas o al llamar end()
}

export interface GameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void; // reinicia partida: score 0, 3 vidas, nivel 1
  end: () => void; // fuerza game over con el score actual
  destroy: () => void; // cancela rAF y quita listeners
}

export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
) => GameHandle;
