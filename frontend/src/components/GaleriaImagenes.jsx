import { useState } from "react";
import ImagenProducto from "./ImagenProducto";
import ModalGaleria from "./ModalGaleria";
import "../styles/GaleriaImagenes.css";

/**
 * Galería del detalle: imagen principal a la izquierda y grilla 2x2 con las
 * cuatro siguientes a la derecha (cinco en total). "Ver más" abre el modal con
 * todas las imágenes del producto.
 */
export default function GaleriaImagenes({ nombre, imagenes = [] }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  if (imagenes.length === 0) {
    return <p className="estado-vacio">Este alojamiento todavía no tiene imágenes cargadas.</p>;
  }

  const principal = imagenes[0];
  const secundarias = imagenes.slice(1, 5);

  return (
    <section className="galeria" aria-label={`Imágenes de ${nombre}`}>
      <figure className="galeria__principal">
        <ImagenProducto url={principal.url} alt={`${nombre}, imagen principal`} />
      </figure>

      <div className="galeria__grilla">
        {secundarias.map((imagen, indice) => (
          <figure key={imagen.id} className="galeria__item">
            <ImagenProducto
              url={imagen.url}
              alt={`${nombre}, imagen ${indice + 2}`}
              loading="lazy"
            />
          </figure>
        ))}
      </div>

      <button type="button" className="galeria__ver-mas" onClick={() => setModalAbierto(true)}>
        Ver más
      </button>

      {modalAbierto && (
        <ModalGaleria nombre={nombre} imagenes={imagenes} onCerrar={() => setModalAbierto(false)} />
      )}
    </section>
  );
}
