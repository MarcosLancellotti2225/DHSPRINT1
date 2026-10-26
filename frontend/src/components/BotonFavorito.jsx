import useFavoritos from "../hooks/useFavoritos";
import useSesion from "../hooks/useSesion";
import "../styles/BotonFavorito.css";

/**
 * Corazón para marcar un alojamiento como favorito, de un solo clic.
 *
 * Sólo aparece con sesión iniciada: los favoritos se guardan en la cuenta, así que
 * ofrecérselo a un visitante anónimo sería prometer algo que no se puede cumplir.
 */
export default function BotonFavorito({ producto }) {
  const { autenticado } = useSesion();
  const { esFavorito, alternar } = useFavoritos();

  if (!autenticado) return null;

  const marcado = esFavorito(producto.id);
  const etiqueta = marcado
    ? `Quitar ${producto.nombre} de favoritos`
    : `Agregar ${producto.nombre} a favoritos`;

  return (
    <button
      type="button"
      className={`favorito${marcado ? " favorito--marcado" : ""}`}
      aria-pressed={marcado}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={(evento) => {
        // La tarjeta entera es un enlace al detalle: el corazón no debe navegar.
        evento.preventDefault();
        evento.stopPropagation();
        alternar(producto);
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 20.3 4.6 13a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l.6.6.6-.6a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8z"
          fill={marcado ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
