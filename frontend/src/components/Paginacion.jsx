import "../styles/Paginacion.css";

/**
 * Controles de paginación: ir al inicio del listado, retroceder, avanzar,
 * y contador de páginas.
 */
export default function Paginacion({ pagina, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  const esPrimera = pagina === 0;
  const esUltima = pagina >= totalPaginas - 1;

  return (
    <nav className="paginacion" aria-label="Paginación de alojamientos">
      <button
        type="button"
        className="boton boton--contorno"
        onClick={() => onCambiarPagina(0)}
        disabled={esPrimera}
      >
        « Inicio
      </button>

      <button
        type="button"
        className="boton boton--contorno"
        onClick={() => onCambiarPagina(pagina - 1)}
        disabled={esPrimera}
      >
        ‹ Anterior
      </button>

      <span className="paginacion__contador" aria-live="polite">
        Página {pagina + 1} de {totalPaginas}
      </span>

      <button
        type="button"
        className="boton boton--contorno"
        onClick={() => onCambiarPagina(pagina + 1)}
        disabled={esUltima}
      >
        Siguiente ›
      </button>

      <button
        type="button"
        className="boton boton--contorno"
        onClick={() => onCambiarPagina(totalPaginas - 1)}
        disabled={esUltima}
      >
        Final »
      </button>
    </nav>
  );
}
