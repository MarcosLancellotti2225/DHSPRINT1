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
  {
    id: "categorias",
    titulo: "Agregar categoría",
    descripcion: "Crear y editar las categorías con las que se organiza el catálogo.",
    ruta: "/administracion/categorias",
  },
  {
    id: "caracteristicas",
    titulo: "Administrar características",
    descripcion: "Añadir, editar y eliminar las características de los alojamientos.",
    ruta: "/administracion/caracteristicas",
  },
  {
    id: "usuarios",
    titulo: "Usuarios registrados",
    descripcion: "Ver los usuarios y otorgarles o quitarles permisos de administrador.",
    ruta: "/administracion/usuarios",
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
