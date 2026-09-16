import IconoCaracteristica from "./IconoCaracteristica";
import "../styles/CaracteristicasProducto.css";

/**
 * Bloque "Características" del detalle: el título y, debajo, todas las
 * características del alojamiento, cada una con su ícono.
 */
export default function CaracteristicasProducto({ caracteristicas }) {
  return (
    <section className="caracteristicas" aria-labelledby="caracteristicas-titulo">
      <h2 id="caracteristicas-titulo" className="titulo-seccion">
        Características
      </h2>

      {caracteristicas.length === 0 ? (
        <p className="caracteristicas__vacio">
          Este alojamiento todavía no tiene características cargadas.
        </p>
      ) : (
        <ul className="caracteristicas__lista">
          {caracteristicas.map((caracteristica) => (
            <li key={caracteristica.id} className="caracteristicas__item">
              <span className="caracteristicas__icono">
                <IconoCaracteristica icono={caracteristica.icono} tamanio={22} />
              </span>
              <span className="caracteristicas__nombre">{caracteristica.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
