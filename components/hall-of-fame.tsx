"use client";

import Link from "next/link";
import { useSession } from "@/components/session-provider";
import type { Game, ScoreRow } from "@/lib/types";

interface Props {
  games: Game[];
  selectedId: string;
  rows: ScoreRow[];
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 80,
        color: "var(--ink-faint)",
      }}
    >
      <div
        className="pixel"
        style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}
      >
        {title}
      </div>
      <div>{text}</div>
    </div>
  );
}

export function HallOfFame({ games, selectedId, rows }: Props) {
  const { user } = useSession();

  if (games.length === 0) {
    return (
      <Empty
        title="SALÓN NO DISPONIBLE"
        text="No pudimos cargar los juegos. Intenta de nuevo en unos segundos."
      />
    );
  }

  const [first, second, third] = rows;

  return (
    <>
      <div className="hall-tabs">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/salon?juego=${g.id}`}
            className={"chip" + (selectedId === g.id ? " active" : "")}
            scroll={false}
          >
            {g.title}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty
          title="AÚN NO HAY PUNTUACIONES"
          text="Nadie ha entrado al Salón en este juego. ¡Sé el primero!"
        />
      ) : (
        <>
          <div className="podium">
            {second && (
              <div className="podium-slot silver">
                <div className="rank-num">02</div>
                <div className="name">{second.name}</div>
                <div className="score">
                  {second.score.toLocaleString("es-ES")}
                </div>
                <div className="date">{second.date}</div>
              </div>
            )}
            <div className="podium-slot gold">
              <div
                className="pixel"
                style={{
                  fontSize: 9,
                  color: "var(--gold)",
                  letterSpacing: "0.18em",
                }}
              >
                CAMPEÓN
              </div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                01
              </div>
              <div className="name">{first.name}</div>
              <div className="score" style={{ fontSize: 20 }}>
                {first.score.toLocaleString("es-ES")}
              </div>
              <div className="date">{first.date}</div>
            </div>
            {third && (
              <div className="podium-slot bronze">
                <div className="rank-num">03</div>
                <div className="name">{third.name}</div>
                <div className="score">
                  {third.score.toLocaleString("es-ES")}
                </div>
                <div className="date">{third.date}</div>
              </div>
            )}
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => {
              const mine = user?.name === r.name;
              const tint = mine ? { color: "var(--yellow)" } : undefined;
              return (
                <div
                  key={r.rank}
                  className={
                    "tr" +
                    (i === 0
                      ? " top1"
                      : i === 1
                        ? " top2"
                        : i === 2
                          ? " top3"
                          : "") +
                    (mine ? " you" : "")
                  }
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="rk" style={tint}>
                    #{String(r.rank).padStart(2, "0")}
                  </div>
                  <div className="pl" style={tint}>
                    {r.name}
                    {mine && " ◂ TÚ"}
                  </div>
                  <div className="sc" style={tint}>
                    {r.score.toLocaleString("es-ES")}
                  </div>
                  <div className="dt">{r.date}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
