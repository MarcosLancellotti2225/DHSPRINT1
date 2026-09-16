import "../styles/Categorias.css";

/**
 * Filtro por categorías del home. Se pueden seleccionar varias a la vez y el
 * filtrado lo resuelve el backend: acá sólo se maneja la selección.
 */
export default function Categorias({
  categorias,
  seleccionadas,
  onAlternar,
  onLimpiar,
  cantidadFiltrada,
  totalProductos,
  cargando = false,
}) {
  const hayFiltro = seleccionadas.length > 0;

  return (
    <section className="categorias" aria-labelledby="categorias-titulo">
      <div className="categorias__encabezado">
        <h2 id="categorias-titulo" className="titulo-seccion categorias__titulo">
          Categorías
        </h2>

        {hayFiltro && (
          <button type="button" className="btn btn-ghost" onClick={onLimpiar}>
            Limpiar filtros
          </button>
        )}
      </div>

      {cargando ? (
        <p className="categorias__vacio">Cargando categorías…</p>
      ) : categorias.length === 0 ? (
        <p className="categorias__vacio">Todavía no hay categorías cargadas.</p>
      ) : (
        <ul className="categorias__lista">
          {categorias.map((categoria) => {
            const activa = seleccionadas.includes(categoria.id);
            return (
              <li key={categoria.id}>
                <button
                  type="button"
                  className={`card categorias__tarjeta${activa ? " categorias__tarjeta--activa" : ""}`}
                  aria-pressed={activa}
                  onClick={() => onAlternar(categoria.id)}
                >
                  <span className="categorias__nombre">{categoria.titulo}</span>
                  <span className="categorias__descripcion">{categoria.descripcion}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="categorias__contador" aria-live="polite">
        {hayFiltro
          ? `Mostrando ${cantidadFiltrada} de ${totalProductos} alojamientos`
          : `${totalProductos} alojamientos en el catálogo`}
      </p>
    </section>
  );
}
