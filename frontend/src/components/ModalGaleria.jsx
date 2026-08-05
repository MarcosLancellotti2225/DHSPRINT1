import { useEffect } from "react";
import { urlImagen } from "../api/client";
import "../styles/ModalGaleria.css";

/** Muestra todas las imágenes disponibles del producto. */
export default function ModalGaleria({ nombre, imagenes, onCerrar }) {
  // Cerrar con Escape y bloquear el scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alPresionarTecla);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowOriginal;
    };
  }, [onCerrar]);

  return (
    <div
      className="modal-galeria"
      role="dialog"
      aria-modal="true"
      aria-label={`Todas las imágenes de ${nombre}`}
      onClick={onCerrar}
    >
      {/* El click dentro del panel no debe cerrar el modal. */}
      <div className="modal-galeria__panel" onClick={(evento) => evento.stopPropagation()}>
        <header className="modal-galeria__header">
          <h2 className="modal-galeria__titulo">{nombre}</h2>
          <button
            type="button"
            className="modal-galeria__cerrar"
            onClick={onCerrar}
            aria-label="Cerrar galería"
          >
            ✕
          </button>
        </header>

        <div className="modal-galeria__grilla">
          {imagenes.map((imagen, indice) => (
            <figure key={imagen.id} className="modal-galeria__item">
              <img src={urlImagen(imagen.url)} alt={`${nombre}, imagen ${indice + 1}`} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
