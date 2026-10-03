import Link from "next/link";
import type { Metadata } from "next";
import { HallOfFame } from "@/components/hall-of-fame";
import { getGames, getTopScores } from "@/lib/queries";

export const metadata: Metadata = { title: "Salón de la Fama" };

export default async function SalonPage({ searchParams }: PageProps<"/salon">) {
  const { juego } = await searchParams;
  const games = await getGames();
  // Un `juego` inválido cae al primer juego del catálogo.
  const selected = games.find((g) => g.id === juego) ?? games[0];
  const rows = selected ? await getTopScores(selected.id, 20) : [];

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <HallOfFame games={games} selectedId={selected?.id ?? ""} rows={rows} />

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
