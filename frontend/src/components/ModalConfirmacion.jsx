import useModal from "../hooks/useModal";

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
  const panelRef = useModal(onCancelar);

  return (
    <div className="dialog-backdrop" onClick={onCancelar}>
      <div
        ref={panelRef}
        tabIndex={-1}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="dialog-title" id="confirmacion-titulo">
          {titulo}
        </div>
        <div className="dialog-body">{mensaje}</div>

        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
            disabled={procesando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className="btn btn-primary"
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
