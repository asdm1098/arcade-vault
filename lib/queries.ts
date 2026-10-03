import { createClient } from "./supabase/server";
import type {
  ActivityRow,
  Category,
  Game,
  GameColor,
  ScoreRow,
  TopPlayer,
} from "./types";
import type { Tables } from "./supabase/database.types";

type GameRow = Tables<"games">;
type StatsRow = Tables<"game_stats">;

// 842 -> "842", 12400 -> "12.4K", 1250000 -> "1.3M"
export function formatPlays(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

// ISO -> "DD/MM/YYYY"
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${mon}/${d.getUTCFullYear()}`;
}

// ISO -> "hace 2 min" | "hace 3 h" | "hace 2 d"
export function formatAgo(iso: string, now = Date.now()): string {
  const min = Math.max(1, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function toGame(row: GameRow, stats?: StatsRow): Game {
  return {
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long,
    cat: row.cat as Category,
    cover: row.cover,
    color: row.color as GameColor,
    best: stats?.best ?? 0,
    plays: formatPlays(stats?.plays ?? 0),
  };
}

export async function getGames(): Promise<Game[]> {
  try {
    const supabase = await createClient();
    const [games, stats] = await Promise.all([
      supabase.from("games").select("*").order("sort_order"),
      supabase.from("game_stats").select("*"),
    ]);
    if (games.error || stats.error) return [];
    const byId = new Map(stats.data.map((s) => [s.game_id, s]));
    return games.data.map((g) => toGame(g, byId.get(g.id)));
  } catch {
    return [];
  }
}

export async function getGame(id: string): Promise<Game | null> {
  try {
    const supabase = await createClient();
    const [game, stats] = await Promise.all([
      supabase.from("games").select("*").eq("id", id).maybeSingle(),
      supabase.from("game_stats").select("*").eq("game_id", id).maybeSingle(),
    ]);
    if (game.error || stats.error || !game.data) return null;
    return toGame(game.data, stats.data ?? undefined);
  } catch {
    return null;
  }
}

export async function getTopScores(
  gameId: string,
  limit = 20,
): Promise<ScoreRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scores")
      .select("name, score, created_at")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return [];
    return data.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      score: r.score,
      date: formatDate(r.created_at),
    }));
  } catch {
    return [];
  }
}

export async function getRecentActivity(limit = 7): Promise<ActivityRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scores")
      .select("name, score, created_at, games(title, color)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    const now = Date.now();
    return data.flatMap((r) =>
      r.games
        ? [
            {
              player: r.name,
              game: r.games.title,
              score: r.score,
              ago: formatAgo(r.created_at, now),
              color: r.games.color as GameColor,
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
}

// Mejor puntuación individual por nombre, entre todos los juegos.
export async function getTopPlayers(limit = 5): Promise<TopPlayer[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scores")
      .select("name, score")
      .order("score", { ascending: false })
      .limit(500);
    if (error) return [];
    const best = new Map<string, number>();
    for (const r of data) if (!best.has(r.name)) best.set(r.name, r.score);
    return [...best]
      .slice(0, limit)
      .map(([player, score], i) => ({ rank: i + 1, player, score }));
  } catch {
    return [];
  }
}
