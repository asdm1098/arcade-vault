import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGame } from "@/lib/queries";
import { GamePlayer } from "@/components/game-player";

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  return game ? { title: `Jugando ${game.title}` } : {};
}

export default async function PlayPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
