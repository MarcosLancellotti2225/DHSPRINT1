import { useState } from "react";
import ImagenProducto from "./ImagenProducto";
import useModal from "../hooks/useModal";
import "../styles/ModalCompartir.css";

/**
 * Redes a las que se puede compartir.
 *
 * Instagram no está: su API no permite publicar desde la web, así que un botón
 * suyo sería un botón que no hace nada. En su lugar ofrecemos copiar el enlace,
 * que es lo que sirve para pegarlo en una historia o un mensaje.
 */
const REDES = [
  {
    id: "facebook",
    nombre: "Facebook",
    enlace: ({ url, mensaje }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${mensaje}`,
  },
  {
    id: "twitter",
    nombre: "X (Twitter)",
    enlace: ({ url, mensaje }) => `https://twitter.com/intent/tweet?url=${url}&text=${mensaje}`,
  },
  {
    id: "whatsapp",
    nombre: "WhatsApp",
    enlace: ({ url, mensaje }) => `https://api.whatsapp.com/send?text=${mensaje}%20${url}`,
  },
];

export default function ModalCompartir({ producto, onCerrar }) {
  const panelRef = useModal(onCerrar);

  const url = window.location.href;
  const [mensaje, setMensaje] = useState(
    `Mirá este alojamiento en NextHome: ${producto.nombre}`
  );
  const [copiado, setCopiado] = useState(false);

  function compartirEn(red) {
    const destino = red.enlace({
      url: encodeURIComponent(url),
      mensaje: encodeURIComponent(mensaje),
    });
    // noopener evita que la pestaña nueva pueda manipular la nuestra.
    window.open(destino, "_blank", "noopener,noreferrer");
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(`${mensaje} ${url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onCerrar}>
      <div
        ref={panelRef}
        tabIndex={-1}
        className="dialog compartir"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compartir-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="dialog-title" id="compartir-titulo">
          Compartir este alojamiento
        </div>

        {/* Vista previa de lo que va a ver quien reciba el enlace. */}
        <div className="compartir__vista-previa">
          <ImagenProducto
            url={producto.imagenes?.[0]?.url}
            alt={producto.nombre}
            className="compartir__imagen"
          />
          <div className="compartir__datos">
            <span className="compartir__nombre">{producto.nombre}</span>
            <p className="compartir__descripcion">{producto.descripcion}</p>
            <span className="compartir__url">{url}</span>
          </div>
        </div>

        <div className="field compartir__campo">
          <label htmlFor="mensaje-compartir">Tu mensaje</label>
          <textarea
            id="mensaje-compartir"
            className="input"
            rows={2}
            maxLength={280}
            value={mensaje}
            onChange={(evento) => setMensaje(evento.target.value)}
          />
        </div>

        <div className="compartir__redes">
          {REDES.map((red) => (
            <button
              key={red.id}
              type="button"
              className="btn btn-secondary compartir__red"
              onClick={() => compartirEn(red)}
            >
              {red.nombre}
            </button>
          ))}

          <button type="button" className="btn btn-secondary compartir__red" onClick={copiarEnlace}>
            {copiado ? "¡Enlace copiado!" : "Copiar enlace"}
          </button>
        </div>

        <p className="compartir__aclaracion">
          Instagram no permite publicar desde la web. Copiá el enlace y pegalo en tu
          historia o en un mensaje.
        </p>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
