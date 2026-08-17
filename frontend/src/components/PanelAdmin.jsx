import usePantallaChica from "../hooks/usePantallaChica";
import "../styles/Admin.css";

/**
 * Envoltorio de las pantallas de administración.
 *
 * El header y el footer del sitio los pone el Layout, así que acá sólo va el
 * encabezado de la sección.
 *
 * El panel no es responsive por decisión de producto: en viewports chicos se
 * muestra un aviso en lugar del contenido.
 */
export default function PanelAdmin({ titulo, ruta, acciones, children }) {
  const pantallaChica = usePantallaChica();

  if (pantallaChica) {
    return (
      <div className="admin__bloqueado">
        <p>
          El panel de administración no está disponible en este dispositivo. Ingresá desde una
          pantalla más grande.
        </p>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin__encabezado">
        <div>
          <p className="admin__seccion">Administración</p>
          <h1 className="admin__titulo">{titulo}</h1>
          {ruta && <p className="admin__ruta">{ruta}</p>}
        </div>
        {acciones}
      </div>

      {children}
    </div>
  );
}
