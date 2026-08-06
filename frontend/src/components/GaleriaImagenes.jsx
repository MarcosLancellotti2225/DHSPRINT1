import { useState } from "react";
import ImagenProducto from "./ImagenProducto";
import ModalGaleria from "./ModalGaleria";
import "../styles/GaleriaImagenes.css";

/**
 * Galería del detalle: foto principal a la izquierda y grilla 2x2 con las
 * cuatro siguientes a la derecha (cinco en total). "Ver más" abre el modal
 * con todas las fotos del alojamiento.
 */
export default function GaleriaImagenes({ nombre, imagenes = [] }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  if (imagenes.length === 0) {
    return <p className="estado-vacio">Este alojamiento todavía no tiene imágenes cargadas.</p>;
  }

  const principal = imagenes[0];
  const secundarias = imagenes.slice(1, 5);

  return (
    <section className="nh-gallery" aria-label={`Imágenes de ${nombre}`}>
      <ImagenProducto
        url={principal.url}
        alt={`${nombre}, imagen principal`}
        className="nh-gallery__principal"
      />

      <div className="nh-gallery-side">
        {secundarias.map((imagen, indice) => (
          <ImagenProducto
            key={imagen.id}
            url={imagen.url}
            alt={`${nombre}, imagen ${indice + 2}`}
            className="nh-gallery__item"
            loading="lazy"
          />
        ))}
      </div>

      <button
        type="button"
        className="btn btn-secondary nh-gallery__ver-mas"
        onClick={() => setModalAbierto(true)}
      >
        Ver más
      </button>

      {modalAbierto && (
        <ModalGaleria nombre={nombre} imagenes={imagenes} onCerrar={() => setModalAbierto(false)} />
      )}
    </section>
  );
}
