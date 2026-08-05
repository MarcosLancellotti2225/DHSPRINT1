import { Link } from "react-router-dom";
import usePantallaChica from "../hooks/usePantallaChica";
import "../styles/Admin.css";

/**
 * Envoltorio común de las pantallas de administración.
 * El panel no es responsive por decisión de producto: en viewports chicos se
 * muestra un aviso en lugar del contenido.
 */
export default function PanelAdmin({ titulo, acciones, children }) {
  const pantallaChica = usePantallaChica();

  if (pantallaChica) {
    return (
      <div className="admin__bloqueado">
        <h1 className="admin__bloqueado-titulo">Panel no disponible</h1>
        <p>
          El panel de administración no está disponible en dispositivos móviles. Ingresá desde una
          computadora o ampliá la ventana del navegador.
        </p>
        <Link to="/" className="boton boton--primario">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="admin contenedor">
      <header className="admin__header">
        <div>
          <p className="admin__migas">Administración</p>
          <h1 className="admin__titulo">{titulo}</h1>
        </div>
        {acciones && <div className="admin__acciones">{acciones}</div>}
      </header>

      {children}
    </div>
  );
}
