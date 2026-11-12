import { useCallback, useEffect, useRef, useState } from "react";
import ImagenProducto from "./ImagenProducto";
import useModal from "../hooks/useModal";
import "../styles/ModalGaleria.css";

/** Da la vuelta en los extremos: de la última se pasa a la primera. */
export function siguienteIndice(actual, total, paso) {
  if (total <= 0) return 0;
  return (actual + paso + total) % total;
}

/** Carrusel con todas las fotos del alojamiento, a pantalla grande. */
export default function ModalGaleria({ nombre, imagenes, onCerrar, indiceInicial = 0 }) {
  const panelRef = useModal(onCerrar);
  const [indice, setIndice] = useState(indiceInicial);
  const tirasRef = useRef(null);

  const total = imagenes.length;
  const actual = imagenes[indice];

  const mover = useCallback(
    (paso) => setIndice((previo) => siguienteIndice(previo, total, paso)),
    [total]
  );

  // Las flechas del teclado son lo que uno espera en un carrusel. Escape y Tab
  // los maneja useModal.
  useEffect(() => {
    function alPresionar(evento) {
      if (evento.key === "ArrowRight") mover(1);
      else if (evento.key === "ArrowLeft") mover(-1);
    }
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [mover]);

  // La miniatura activa se mantiene a la vista al avanzar con el teclado.
  useEffect(() => {
    const activa = tirasRef.current?.querySelector('[aria-current="true"]');
    activa?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [indice]);

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
        <div className="dialog-title modal-galeria__encabezado">
          <span>{nombre}</span>
          <span className="modal-galeria__contador" aria-live="polite">
            {indice + 1} de {total}
          </span>
        </div>

        <div className="dialog-body modal-galeria__cuerpo">
          <div className="modal-galeria__escenario">
            {total > 1 && (
              <button
                type="button"
                className="modal-galeria__flecha modal-galeria__flecha--atras"
                onClick={() => mover(-1)}
                aria-label="Imagen anterior"
              >
                ‹
              </button>
            )}

            {actual && (
              <ImagenProducto
                key={actual.id}
                url={actual.url}
                alt={`${nombre}, imagen ${indice + 1} de ${total}`}
                className="modal-galeria__grande"
              />
            )}

            {total > 1 && (
              <button
                type="button"
                className="modal-galeria__flecha modal-galeria__flecha--adelante"
                onClick={() => mover(1)}
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            )}
          </div>

          {/* Con una sola foto la tira no aporta nada. */}
          {total > 1 && (
            <ul className="modal-galeria__tiras" ref={tirasRef}>
              {imagenes.map((imagen, posicion) => (
                <li key={imagen.id}>
                  <button
                    type="button"
                    className={`modal-galeria__tira${
                      posicion === indice ? " modal-galeria__tira--activa" : ""
                    }`}
                    aria-current={posicion === indice}
                    aria-label={`Ver imagen ${posicion + 1}`}
                    onClick={() => setIndice(posicion)}
                  >
                    <ImagenProducto
                      url={imagen.url}
                      alt=""
                      className="modal-galeria__tira-imagen"
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
