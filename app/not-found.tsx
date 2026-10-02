import Link from "next/link";

export default function NotFound() {
  return (
    <div className="av-hero fade-in">
      <h1 className="flicker">404</h1>
      <div className="sub">
        JUEGO NO ENCONTRADO <span className="blink">_</span>
      </div>
      <p
        style={{
          marginTop: 12,
          color: "var(--ink-faint)",
          fontSize: 12,
          letterSpacing: "0.1em",
        }}
      >
        ESTA RUTA NO EXISTE EN EL VAULT.
      </p>
      <div style={{ marginTop: 28 }}>
        <Link href="/games" className="btn lg">
          VOLVER AL VAULT
        </Link>
      </div>
    </div>
  );
}
