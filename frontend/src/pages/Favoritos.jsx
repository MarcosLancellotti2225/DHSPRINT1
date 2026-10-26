import { Link } from "react-router-dom";
import ProductoCard from "../components/ProductoCard";
import useFavoritos from "../hooks/useFavoritos";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Favoritos.css";

/**
 * Lista de favoritos del usuario. Se alimenta del mismo contexto que los corazones
 * del home, así que marcar o desmarcar en cualquier parte del sitio se ve acá al
 * instante, sin recargar.
 */
export default function Favoritos() {
  useTituloPagina("Mis favoritos");

  const { productos, cargando, error } = useFavoritos();

  return (
    <div className="favoritos">
      <header className="favoritos__encabezado">
        <div>
          <p className="favoritos__seccion">Mi cuenta</p>
          <h1 className="favoritos__titulo">Mis favoritos</h1>
        </div>
        <Link to="/" className="btn btn-secondary">
          ← Seguir explorando
        </Link>
      </header>

      {error && <p className="mensaje mensaje--error">{error}</p>}

      {cargando ? (
        <p className="estado-vacio">Cargando tus favoritos…</p>
      ) : productos.length === 0 ? (
        <div className="estado-vacio">
          <p>Todavía no marcaste ningún alojamiento como favorito.</p>
          <p className="favoritos__ayuda">
            Tocá el corazón de cualquier alojamiento para guardarlo acá.
          </p>
          <Link to="/" className="btn btn-primary">
            Ver alojamientos
          </Link>
        </div>
      ) : (
        <>
          <p className="favoritos__contador" aria-live="polite">
            {productos.length === 1
              ? "1 alojamiento guardado"
              : `${productos.length} alojamientos guardados`}
          </p>

          <ul className="nh-products">
            {productos.map((producto) => (
              <li key={producto.id}>
                <ProductoCard producto={producto} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
