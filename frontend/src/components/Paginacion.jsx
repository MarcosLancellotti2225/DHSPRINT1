import "../styles/Paginacion.css";

/**
 * Controles de paginación: ir al inicio del listado, atrás y adelante,
 * más el contador de páginas.
 */
export default function Paginacion({ pagina, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  const esPrimera = pagina === 0;
  const esUltima = pagina >= totalPaginas - 1;

  return (
    <nav className="paginacion" aria-label="Paginación de alojamientos">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onCambiarPagina(0)}
        disabled={esPrimera}
      >
        « Inicio
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onCambiarPagina(pagina - 1)}
        disabled={esPrimera}
      >
        ‹ Atrás
      </button>

      <span className="paginacion__contador" aria-live="polite">
        Página {pagina + 1} de {totalPaginas}
      </span>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onCambiarPagina(pagina + 1)}
        disabled={esUltima}
      >
        Adelante ›
      </button>
    </nav>
  );
}
