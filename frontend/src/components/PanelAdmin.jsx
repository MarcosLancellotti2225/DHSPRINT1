import { Link } from "react-router-dom";
import { Isotipo } from "./Logo";
import usePantallaChica from "../hooks/usePantallaChica";
import "../styles/Admin.css";

/**
 * Envoltorio de las pantallas de administración: barra propia con la marca y
 * el sufijo "/ administración".
 *
 * El panel no es responsive por decisión de producto: en viewports chicos se
 * muestra un aviso en lugar del contenido.
 */
export default function PanelAdmin({ titulo, ruta, acciones, children }) {
  const pantallaChica = usePantallaChica();

  return (
    <>
      <div className="nav admin__nav">
        <Link to="/" className="admin__marca">
          <Isotipo tamanio={24} />
          <span className="admin__marca-texto">
            Next<span className="admin__marca-acento">Home</span>{" "}
            <span className="admin__marca-seccion">/ administración</span>
          </span>
        </Link>
      </div>

      {pantallaChica ? (
        <div className="admin__bloqueado">
          <p>
            El panel de administración no está disponible en este dispositivo. Ingresá desde una
            pantalla más grande.
          </p>
        </div>
      ) : (
        <div className="admin">
          <div className="admin__encabezado">
            <div>
              <h1 className="admin__titulo">{titulo}</h1>
              {ruta && <p className="admin__ruta">{ruta}</p>}
            </div>
            {acciones}
          </div>

          {children}
        </div>
      )}
    </>
  );
}
