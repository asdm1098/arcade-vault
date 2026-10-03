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

export interface ActivityRow {
  player: string; // p. ej. "NEONFOX"
  game: string; // título visible, p. ej. "Caída"
  score: number;
  ago: string; // ya formateado, p. ej. "hace 2 min"
  color: GameColor;
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface Feature {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: GameColor;
}

export interface HomeStat {
  n: string; // "12+", "MILES", "GLOBAL"
  unit: string;
  sub: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "send_failed" };
