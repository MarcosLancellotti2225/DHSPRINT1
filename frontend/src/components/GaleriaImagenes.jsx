import { useState } from "react";
import ImagenProducto from "./ImagenProducto";
import ModalGaleria from "./ModalGaleria";
import "../styles/GaleriaImagenes.css";

/**
 * Galería del detalle: foto principal a la izquierda y grilla 2x2 con las
 * cuatro siguientes a la derecha (cinco en total). Cualquiera de ellas abre el
 * carrusel con todas las fotos, empezando por la que se tocó.
 */
export default function GaleriaImagenes({ nombre, imagenes = [] }) {
  // null con el modal cerrado; con un número, la foto por la que abre.
  const [abiertaEn, setAbiertaEn] = useState(null);

  if (imagenes.length === 0) {
    return <p className="estado-vacio">Este alojamiento todavía no tiene imágenes cargadas.</p>;
  }

  const principal = imagenes[0];
  const secundarias = imagenes.slice(1, 5);

  return (
    <section className="nh-gallery" aria-label={`Imágenes de ${nombre}`}>
      <button
        type="button"
        className="nh-gallery__abrir nh-gallery__principal"
        onClick={() => setAbiertaEn(0)}
        aria-label={`Ver ${nombre} en grande, imagen principal`}
      >
        <ImagenProducto
          url={principal.url}
          alt={`${nombre}, imagen principal`}
          className="nh-gallery__imagen"
        />
      </button>

      <div className="nh-gallery-side">
        {secundarias.map((imagen, indice) => (
          <button
            key={imagen.id}
            type="button"
            className="nh-gallery__abrir nh-gallery__item"
            onClick={() => setAbiertaEn(indice + 1)}
            aria-label={`Ver ${nombre} en grande, imagen ${indice + 2}`}
          >
            <ImagenProducto
              url={imagen.url}
              alt={`${nombre}, imagen ${indice + 2}`}
              className="nh-gallery__imagen"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-secondary nh-gallery__ver-mas"
        onClick={() => setAbiertaEn(0)}
      >
        Ver más
      </button>

      {abiertaEn !== null && (
        <ModalGaleria
          nombre={nombre}
          imagenes={imagenes}
          indiceInicial={abiertaEn}
          onCerrar={() => setAbiertaEn(null)}
        />
      )}
    </section>
  );
}
