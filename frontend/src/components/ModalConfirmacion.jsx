import { useEffect } from "react";
import "../styles/ModalConfirmacion.css";

/** Modal de confirmación para acciones destructivas. */
export default function ModalConfirmacion({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === "Escape") onCancelar();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [onCancelar]);

  return (
    <div
      className="modal-confirmacion"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmacion-titulo"
      onClick={onCancelar}
    >
      <div className="modal-confirmacion__panel" onClick={(evento) => evento.stopPropagation()}>
        <h2 id="confirmacion-titulo" className="modal-confirmacion__titulo">
          {titulo}
        </h2>
        <p className="modal-confirmacion__mensaje">{mensaje}</p>

        <div className="modal-confirmacion__acciones">
          <button
            type="button"
            className="boton boton--contorno"
            onClick={onCancelar}
            disabled={procesando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className="boton boton--peligro"
            onClick={onConfirmar}
            disabled={procesando}
          >
            {procesando ? "Eliminando…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
