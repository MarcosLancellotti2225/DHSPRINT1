import { Link } from "react-router-dom";
import ImagenProducto from "./ImagenProducto";
import "../styles/ProductoCard.css";

export default function ProductoCard({ producto }) {
  const portada = producto.imagenes?.[0];

  return (
    <article className="card elev-sm tarjeta">
      <Link to={`/producto/${producto.id}`} className="tarjeta__enlace">
        <ImagenProducto
          url={portada?.url}
          alt={producto.nombre}
          className="tarjeta__imagen"
          loading="lazy"
        />

        <div className="tarjeta__cuerpo">
          <h3 className="card-title tarjeta__titulo">{producto.nombre}</h3>
          <p className="card-body tarjeta__descripcion">{producto.descripcion}</p>
          <span className="tarjeta__ver">Ver detalle</span>
        </div>
      </Link>
    </article>
  );
}
