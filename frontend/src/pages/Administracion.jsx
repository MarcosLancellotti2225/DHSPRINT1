import { Link } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import "../styles/Admin.css";

/** Funciones de administración disponibles en este sprint. */
const FUNCIONES = [
  {
    id: "listado",
    titulo: "Lista de productos",
    descripcion: "Ver todos los alojamientos cargados y eliminar los que ya no se ofrecen.",
    ruta: "/administracion/productos",
    etiquetaBoton: "Lista de productos",
  },
  {
    id: "alta",
    titulo: "Agregar producto",
    descripcion: "Dar de alta un alojamiento nuevo con su descripción y sus imágenes.",
    ruta: "/administracion/productos/nuevo",
    etiquetaBoton: "Agregar producto",
  },
];

export default function Administracion() {
  return (
    <PanelAdmin titulo="Panel de administración">
      <ul className="admin__menu">
        {FUNCIONES.map((funcion) => (
          <li key={funcion.id}>
            <article className="admin__tarjeta">
              <h2 className="admin__tarjeta-titulo">{funcion.titulo}</h2>
              <p className="admin__tarjeta-texto">{funcion.descripcion}</p>
              <Link to={funcion.ruta} className="boton boton--primario">
                {funcion.etiquetaBoton}
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </PanelAdmin>
  );
}
