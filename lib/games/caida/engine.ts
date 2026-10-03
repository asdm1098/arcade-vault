import type { GameCallbacks, GameHandle, GameStats } from "@/lib/games/types";

// Port de references/started-games/03-tetris/game.js (SPEC 07).

export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;
export const BOARD_W = COLS * BLOCK; // 300
export const BOARD_H = ROWS * BLOCK; // 600
export const PANEL_W = 150;
export const W = BOARD_W + PANEL_W; // 450
export const H = BOARD_H; // 600

export const COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I
  "#ffd54f", // O
  "#ba68c8", // T
  "#81c784", // S
  "#e57373", // Z
  "#90caf9", // J
  "#ffb74d", // L
  "#9e9e9e", // N (tuerca)
];

type Matrix = number[][]; // 0 vacío, 1–8 color

interface Piece {
  type: number;
  shape: Matrix;
  x: number;
  y: number;
}

export const PIECES: (Matrix | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

export const LINE_SCORES = [0, 100, 300, 500, 800];
const KICKS = [0, -1, 1, -2, 2];
const GAME_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyX",
  "Space",
];

// ── Utilidades puras ──────────────────────────────────────────────────────────

export function createBoard(): Matrix {
  return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
}

export function collide(
  board: Matrix,
  shape: Matrix,
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

export function rotateCW(shape: Matrix): Matrix {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Matrix = Array.from({ length: cols }, () =>
    new Array<number>(rows).fill(0),
  );
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

/** Quita las filas llenas (muta `board`) y devuelve cuántas quitó. */
export function clearLines(board: Matrix): number {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((v) => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array<number>(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  return cleared;
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = (PIECES[type] as Matrix).map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

// ── Motor ─────────────────────────────────────────────────────────────────────

export function createCaida(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
): GameHandle {
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  let board: Matrix = createBoard();
  let current: Piece = randomPiece();
  let next: Piece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = 1000;
  let dropAccum = 0;
  let lastTime: number | null = null;
  let paused = false;
  let gameOver = false;
  let destroyed = false;
  let gameOverSent = false;
  let rafId: number | null = null;
  let lastStats: GameStats | null = null;

  function isActive(): boolean {
    return !destroyed && !paused && !gameOver;
  }

  function emitStats(): void {
    if (lastStats && lastStats.score === score && lastStats.level === level)
      return;
    lastStats = { score, lives: 1, level };
    callbacks.onStats({ ...lastStats });
  }

  function sendGameOver(): void {
    if (gameOverSent) return;
    gameOverSent = true;
    callbacks.onGameOver(score);
  }

  function finish(): void {
    gameOver = true;
    stopLoop();
    emitStats();
    draw();
    sendGameOver();
  }

  function tryRotate(): void {
    const rotated = rotateCW(current.shape);
    for (const kick of KICKS) {
      if (!collide(board, rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  function merge(): void {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          board[current.y + r][current.x + c] = current.shape[r][c];
  }

  function spawn(): void {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) finish();
  }

  function lockPiece(): void {
    merge();
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] || 0) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    }
    spawn();
    emitStats();
  }

  function ghostY(): number {
    let gy = current.y;
    while (!collide(board, current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function hardDrop(): void {
    const gy = ghostY();
    score += (gy - current.y) * 2;
    current.y = gy;
    lockPiece();
  }

  // Con la pieza apoyada, soft drop la fija al instante (como el original).
  function softDrop(): void {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      score += 1;
      emitStats();
    } else {
      lockPiece();
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (!GAME_KEYS.includes(e.code)) return;
    if (!isActive()) return;
    e.preventDefault();
    switch (e.code) {
      case "ArrowLeft":
        if (!collide(board, current.shape, current.x - 1, current.y))
          current.x--;
        break;
      case "ArrowRight":
        if (!collide(board, current.shape, current.x + 1, current.y))
          current.x++;
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        hardDrop();
        break;
    }
    if (!gameOver) draw();
  }

  function initGame(): void {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    dropAccum = 0;
    gameOver = false;
    gameOverSent = false;
    next = randomPiece();
    // Misma secuencia que el original: next → current, nuevo next.
    spawn();
    emitStats();
  }

  // Se implementa en el paso 2 (dibujo).
  function draw(): void {
    if (!ctx) return;
    // TODO(paso 2): tablero, fantasma, pieza actual y panel lateral.
    void lines;
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  function loop(ts: number): void {
    rafId = null;
    if (destroyed || paused || gameOver) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    dropAccum += dt * 1000;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(board, current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
    if (gameOver) return; // finish() ya dibujó y avisó
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop(): void {
    if (rafId !== null || destroyed) return;
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // ── Handle ──────────────────────────────────────────────────────────────────
  window.addEventListener("keydown", handleKeyDown);

  initGame();
  draw();
  startLoop();

  return {
    pause() {
      if (destroyed || paused || gameOver) return;
      paused = true;
      stopLoop();
    },
    resume() {
      if (destroyed || !paused) return;
      paused = false;
      if (!gameOver) startLoop(); // startLoop reinicia lastTime
    },
    restart() {
      if (destroyed) return;
      stopLoop();
      paused = false;
      initGame();
      draw();
      startLoop();
    },
    end() {
      if (destroyed || gameOver) return;
      finish();
    },
    destroy() {
      destroyed = true;
      stopLoop();
      window.removeEventListener("keydown", handleKeyDown);
    },
  };
}
