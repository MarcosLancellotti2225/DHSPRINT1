import { useState } from "react";
import { urlImagen } from "../api/client";
import { Isotipo } from "./Logo";
import "../styles/ImagenProducto.css";

/**
 * Imagen de un alojamiento con respaldo propio.
 * Si no hay url, o si el archivo no se puede cargar, muestra el isologo en vez
 * del ícono de imagen rota del navegador.
 */
export default function ImagenProducto({ url, alt, className = "", loading }) {
  const [fallo, setFallo] = useState(false);

  if (!url || fallo) {
    return (
      <div
        className={`imagen-producto__respaldo ${className}`.trim()}
        role="img"
        aria-label={`${alt} (imagen no disponible)`}
      >
        <Isotipo tamanio={48} className="imagen-producto__isotipo" />
      </div>
    );
  }

  return (
    <img
      src={urlImagen(url)}
      alt={alt}
      className={`imagen-producto ${className}`.trim()}
      loading={loading}
      onError={() => setFallo(true)}
    />
  );
}
