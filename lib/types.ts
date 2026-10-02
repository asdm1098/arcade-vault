export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string; // slug, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string; // clase CSS, p. ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string; // ya formateado, p. ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/2026"
}

export interface SessionUser {
  name: string; // mayúsculas, máx. 10 caracteres
}

export interface SavedScore {
  game: string; // Game.id
  score: number;
  name: string;
  at: number; // Date.now()
}
