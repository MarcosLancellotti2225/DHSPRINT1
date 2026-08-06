/**
 * Isotipo de NextHome: un techo con un doble chevron hacia la derecha adentro.
 * La geometría y los colores son los del design system (Nocturne).
 */
export function Isotipo({ tamanio = 26, className = "" }) {
  return (
    <svg
      width={tamanio}
      height={tamanio}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points="10,36 32,14 54,36"
        stroke="var(--color-accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30,34 L40,44 L30,54"
        stroke="var(--color-accent-300)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40,34 L50,44 L40,54"
        stroke="var(--color-accent-300)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

/** Isotipo + nombre, con "Home" en el color de acento. */
export default function Logo({ tamanio = 26, className = "" }) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
    >
      <Isotipo tamanio={tamanio} />
      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}>
        Next<span style={{ color: "var(--color-accent)" }}>Home</span>
      </span>
    </span>
  );
}
