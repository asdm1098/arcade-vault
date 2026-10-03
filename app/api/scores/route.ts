import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_SCORE = 100_000_000;

const invalid = () =>
  NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
const unavailable = () =>
  NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid();
  }
  if (typeof body !== "object" || body === null) return invalid();

  const { game, score, name: rawName } = body as Record<string, unknown>;
  if (typeof game !== "string" || game.length === 0 || game.length > 64) {
    return invalid();
  }
  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_SCORE
  ) {
    return invalid();
  }
  if (typeof rawName !== "string") return invalid();
  const name = rawName.trim().toUpperCase();
  if (name.length < 1 || name.length > 10) return invalid();

  try {
    const supabase = await createClient();

    const { data: found, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", game)
      .maybeSingle();
    if (gameError) return unavailable();
    if (!found) return invalid();

    const { error } = await supabase
      .from("scores")
      .insert({ game_id: game, name, score });
    if (error) return unavailable();

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return unavailable();
  }
}
