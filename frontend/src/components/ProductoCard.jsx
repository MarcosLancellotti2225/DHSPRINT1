import { Link } from "react-router-dom";
import { urlImagen } from "../api/client";
import "../styles/ProductoCard.css";

export default function ProductoCard({ producto }) {
  const portada = producto.imagenes?.[0];

  return (
    <article className="tarjeta">
      <div className="tarjeta__imagen">
        {portada ? (
          <img src={urlImagen(portada.url)} alt={producto.nombre} loading="lazy" />
        ) : (
          <div className="tarjeta__sin-imagen" aria-hidden="true">
            Db
          </div>
        )}
      </div>

      <div className="tarjeta__cuerpo">
        <h3 className="tarjeta__titulo">{producto.nombre}</h3>
        <p className="tarjeta__descripcion">{producto.descripcion}</p>
        <Link to={`/producto/${producto.id}`} className="boton boton--primario tarjeta__enlace">
          Ver más
        </Link>
      </div>
    </article>
  );
}
