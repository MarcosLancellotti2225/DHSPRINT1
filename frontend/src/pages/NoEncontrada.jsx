import { Link } from "react-router-dom";

export default function NoEncontrada() {
  return (
    <div className="contenedor estado-vacio">
      <h1 className="titulo-seccion">Página no encontrada</h1>
      <p>La dirección que buscás no existe o fue movida.</p>
      <p style={{ marginTop: "20px" }}>
        <Link to="/" className="boton boton--primario">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
