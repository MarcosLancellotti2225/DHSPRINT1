import "../styles/Categorias.css";

/**
 * Bloque de categorías del home. Todavía no filtra: el filtrado por categoría
 * llega en un sprint posterior.
 */
const CATEGORIAS = [
  { id: "hoteles", nombre: "Hoteles", icono: "🏨" },
  { id: "departamentos", nombre: "Departamentos", icono: "🏢" },
  { id: "cabanias", nombre: "Cabañas", icono: "🌲" },
  { id: "hostels", nombre: "Hostels", icono: "🛏️" },
];

export default function Categorias() {
  return (
    <section className="categorias contenedor" aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo" className="titulo-seccion">
        Buscar por tipo de alojamiento
      </h2>

      <ul className="categorias__grilla">
        {CATEGORIAS.map((categoria) => (
          <li key={categoria.id}>
            <article className="categorias__tarjeta">
              <span className="categorias__icono" aria-hidden="true">
                {categoria.icono}
              </span>
              <h3 className="categorias__nombre">{categoria.nombre}</h3>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
