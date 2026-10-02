import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/lib/data";
import { GamePlayer } from "@/components/game-player";

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  return game ? { title: `Jugando ${game.title}` } : {};
}

export default async function PlayPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  if (!GAMES.some((g) => g.id === id)) notFound();

  return <GamePlayer id={id} />;
}
