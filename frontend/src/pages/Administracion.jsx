import { Link } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

/** Funciones de administración disponibles en este sprint. */
const FUNCIONES = [
  {
    id: "listado",
    titulo: "Lista de productos",
    descripcion: "Ver, buscar y eliminar alojamientos publicados.",
    ruta: "/administracion/productos",
  },
  {
    id: "alta",
    titulo: "Agregar producto",
    descripcion: "Publicar un nuevo alojamiento en el catálogo.",
    ruta: "/administracion/productos/nuevo",
  },
];

export default function Administracion() {
  useTituloPagina("Panel de administración");

  return (
    <PanelAdmin titulo="Panel de administración" ruta="/administracion">
      <ul className="admin__menu">
        {FUNCIONES.map((funcion) => (
          <li key={funcion.id}>
            <Link to={funcion.ruta} className="card elev-sm admin__opcion">
              <span className="card-title">{funcion.titulo}</span>
              <span className="card-body">{funcion.descripcion}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PanelAdmin>
  );
}
