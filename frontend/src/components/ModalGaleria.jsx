import ImagenProducto from "./ImagenProducto";
import useModal from "../hooks/useModal";
import "../styles/ModalGaleria.css";

/** Muestra todas las imágenes disponibles del producto. */
export default function ModalGaleria({ nombre, imagenes, onCerrar }) {
  const panelRef = useModal(onCerrar);

  return (
    <div className="dialog-backdrop" onClick={onCerrar}>
      {/* El click dentro del panel no debe cerrar el modal. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="dialog modal-galeria"
        role="dialog"
        aria-modal="true"
        aria-label={`Todas las fotos de ${nombre}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="dialog-title">Todas las fotos — {nombre}</div>

        <div className="dialog-body">
          <div className="modal-galeria__grilla">
            {imagenes.map((imagen, indice) => (
              <ImagenProducto
                key={imagen.id}
                url={imagen.url}
                alt={`${nombre}, imagen ${indice + 1}`}
                className="modal-galeria__item"
              />
            ))}
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
