import "../styles/Estrellas.css";

const VALORES = [1, 2, 3, 4, 5];

function Estrella({ llena, tamanio }) {
  return (
    <svg width={tamanio} height={tamanio} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.78L12 16.5l-5.2 2.73 1-5.78-4.2-4.1 5.8-.85z"
        fill={llena ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Estrellas de puntuación. Sin `onElegir` son de sólo lectura; con `onElegir` se
 * vuelven botones para puntuar de 1 a 5.
 */
export default function Estrellas({ valor = 0, onElegir, tamanio = 18, etiqueta }) {
  const soloLectura = !onElegir;

  if (soloLectura) {
    return (
      <span
        className="estrellas"
        role="img"
        aria-label={etiqueta ?? `${valor} de 5 estrellas`}
      >
        {VALORES.map((numero) => (
          <Estrella key={numero} llena={numero <= Math.round(valor)} tamanio={tamanio} />
        ))}
      </span>
    );
  }

  return (
    <span className="estrellas estrellas--editable" role="radiogroup" aria-label="Puntuación">
      {VALORES.map((numero) => (
        <button
          key={numero}
          type="button"
          className="estrellas__boton"
          role="radio"
          aria-checked={numero === valor}
          aria-label={numero === 1 ? "1 estrella" : `${numero} estrellas`}
          onClick={() => onElegir(numero)}
        >
          <Estrella llena={numero <= valor} tamanio={tamanio} />
        </button>
      ))}
    </span>
  );
}
