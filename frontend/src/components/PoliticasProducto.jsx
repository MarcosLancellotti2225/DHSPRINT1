import { useEffect, useState } from "react";
import { listarPoliticas } from "../api/politicas";
import "../styles/PoliticasProducto.css";

/**
 * Bloque de políticas del detalle. Ocupa todo el ancho del contenedor y reparte
 * las políticas en columnas, cada una con su título y su descripción.
 */
export default function PoliticasProducto() {
  const [politicas, setPoliticas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;

    listarPoliticas()
      .then((datos) => vigente && setPoliticas(datos))
      .catch(() => vigente && setError(true))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  // Si no hay políticas que mostrar, el bloque entero no aparece.
  if (cargando || error || politicas.length === 0) return null;

  return (
    <section className="politicas" aria-labelledby="politicas-titulo">
      <h2 id="politicas-titulo" className="titulo-seccion politicas__titulo">
        Qué tenés que saber
      </h2>

      <ul className="politicas__lista">
        {politicas.map((politica) => (
          <li key={politica.id} className="politicas__item">
            <h3 className="politicas__nombre">{politica.titulo}</h3>
            <p className="politicas__descripcion">{politica.descripcion}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
