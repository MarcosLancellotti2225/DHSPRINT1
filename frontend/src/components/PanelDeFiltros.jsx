import { useEffect, useState } from "react";
import { formatearPrecio } from "../utils/precio";
import "../styles/PanelDeFiltros.css";

const HOY = new Date().toISOString().slice(0, 10);

/**
 * Valida el rango de precio antes de aplicarlo. El backend da vuelta un rango
 * invertido en silencio, pero acá conviene decirlo: puede ser un error de tipeo.
 */
export function validarPrecio({ precioMinimo, precioMaximo }) {
  if (precioMinimo === "" || precioMaximo === "") return "";
  if (Number(precioMinimo) > Number(precioMaximo)) {
    return "El precio mínimo no puede ser mayor al máximo";
  }
  return "";
}

/**
 * Columna de filtros de la página de búsqueda: fechas, huéspedes, categorías,
 * rango de precio y características.
 *
 * Cada cambio se aplica al instante (sube a la URL) salvo el precio, que se
 * confirma: escribir "1" de camino a "10000" dispararía búsquedas que nadie pidió.
 */
export default function PanelDeFiltros({
  filtros,
  categorias = [],
  caracteristicas = [],
  cargando = false,
  onCambiar,
  onLimpiar,
  hayFiltros = false,
}) {
  // El precio es local hasta que se aplica; el resto sale directo de la URL.
  const [precioMinimo, setPrecioMinimo] = useState(filtros.precioMinimo);
  const [precioMaximo, setPrecioMaximo] = useState(filtros.precioMaximo);
  const [errorDePrecio, setErrorDePrecio] = useState("");

  // Si la URL cambia por fuera del panel (atrás, limpiar, un link), los inputs
  // tienen que seguirla.
  useEffect(() => {
    setPrecioMinimo(filtros.precioMinimo);
    setPrecioMaximo(filtros.precioMaximo);
    setErrorDePrecio("");
  }, [filtros.precioMinimo, filtros.precioMaximo]);

  function aplicarPrecio(evento) {
    evento.preventDefault();
    const error = validarPrecio({ precioMinimo, precioMaximo });
    setErrorDePrecio(error);
    if (error) return;
    onCambiar({ precioMinimo, precioMaximo });
  }

  function alternarEnLista(clave, id) {
    const actuales = filtros[clave] ?? [];
    onCambiar({
      [clave]: actuales.includes(id)
        ? actuales.filter((otro) => otro !== id)
        : [...actuales, id],
    });
  }

  return (
    <aside className="panel-filtros" aria-labelledby="filtros-titulo">
      <div className="panel-filtros__encabezado">
        <h2 id="filtros-titulo" className="titulo-seccion panel-filtros__titulo">
          Filtros
        </h2>
        {hayFiltros && (
          <button type="button" className="btn btn-ghost" onClick={onLimpiar}>
            Limpiar todo
          </button>
        )}
      </div>

      {/* --- Fechas y huéspedes ------------------------------------------- */}
      <section className="panel-filtros__grupo">
        <h3 className="panel-filtros__subtitulo">Estadía</h3>

        <div className="field">
          <label htmlFor="filtro-entrada">Check-in</label>
          <input
            id="filtro-entrada"
            className="input"
            type="date"
            min={HOY}
            value={filtros.entrada}
            onChange={(e) => onCambiar({ entrada: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="filtro-salida">Check-out</label>
          <input
            id="filtro-salida"
            className="input"
            type="date"
            min={filtros.entrada || HOY}
            value={filtros.salida}
            onChange={(e) => onCambiar({ salida: e.target.value })}
          />
        </div>

        {/* El rango incompleto no filtra nada, y conviene decirlo antes de que
            el usuario crea que las fechas se están aplicando. */}
        {Boolean(filtros.entrada) !== Boolean(filtros.salida) && (
          <p className="panel-filtros__aviso">
            Completá las dos fechas para filtrar por disponibilidad.
          </p>
        )}

        <div className="field">
          <label htmlFor="filtro-huespedes">Huéspedes</label>
          <input
            id="filtro-huespedes"
            className="input"
            type="number"
            min="0"
            max="20"
            value={filtros.huespedes || ""}
            placeholder="Cualquiera"
            onChange={(e) => onCambiar({ huespedes: Number(e.target.value) || 0 })}
          />
        </div>
      </section>

      {/* --- Rango de precio ---------------------------------------------- */}
      <section className="panel-filtros__grupo">
        <h3 className="panel-filtros__subtitulo">Precio por noche</h3>

        <form className="panel-filtros__precio" onSubmit={aplicarPrecio} noValidate>
          <div className="panel-filtros__precio-campos">
            <div className="field">
              <label htmlFor="filtro-precio-min">Desde</label>
              <input
                id="filtro-precio-min"
                className="input"
                type="number"
                min="0"
                step="1000"
                placeholder="Sin mínimo"
                value={precioMinimo}
                onChange={(e) => setPrecioMinimo(e.target.value)}
                aria-invalid={Boolean(errorDePrecio)}
                aria-describedby={errorDePrecio ? "error-precio" : undefined}
              />
            </div>

            <div className="field">
              <label htmlFor="filtro-precio-max">Hasta</label>
              <input
                id="filtro-precio-max"
                className="input"
                type="number"
                min="0"
                step="1000"
                placeholder="Sin máximo"
                value={precioMaximo}
                onChange={(e) => setPrecioMaximo(e.target.value)}
                aria-invalid={Boolean(errorDePrecio)}
                aria-describedby={errorDePrecio ? "error-precio" : undefined}
              />
            </div>
          </div>

          {errorDePrecio && (
            <p id="error-precio" className="panel-filtros__error" role="alert">
              {errorDePrecio}
            </p>
          )}

          <button type="submit" className="btn btn-secondary panel-filtros__aplicar">
            Aplicar precio
          </button>
        </form>
      </section>

      {/* --- Categorías --------------------------------------------------- */}
      <section className="panel-filtros__grupo">
        <h3 className="panel-filtros__subtitulo">Categorías</h3>

        {cargando ? (
          <p className="panel-filtros__vacio">Cargando…</p>
        ) : categorias.length === 0 ? (
          <p className="panel-filtros__vacio">No hay categorías cargadas.</p>
        ) : (
          <ul className="panel-filtros__lista">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <label className="panel-filtros__opcion">
                  <input
                    type="checkbox"
                    checked={(filtros.categorias ?? []).includes(categoria.id)}
                    onChange={() => alternarEnLista("categorias", categoria.id)}
                  />
                  <span>{categoria.titulo}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Características ---------------------------------------------- */}
      <section className="panel-filtros__grupo">
        <h3 className="panel-filtros__subtitulo">Características</h3>

        {cargando ? (
          <p className="panel-filtros__vacio">Cargando…</p>
        ) : caracteristicas.length === 0 ? (
          <p className="panel-filtros__vacio">No hay características cargadas.</p>
        ) : (
          <>
            <ul className="panel-filtros__lista">
              {caracteristicas.map((caracteristica) => (
                <li key={caracteristica.id}>
                  <label className="panel-filtros__opcion">
                    <input
                      type="checkbox"
                      checked={(filtros.caracteristicas ?? []).includes(caracteristica.id)}
                      onChange={() => alternarEnLista("caracteristicas", caracteristica.id)}
                    />
                    <span>{caracteristica.nombre}</span>
                  </label>
                </li>
              ))}
            </ul>

            {/* Es "todas" y no "alguna": conviene decirlo, porque explica por qué
                sumar una característica más puede dejar la lista vacía. */}
            {(filtros.caracteristicas?.length ?? 0) > 1 && (
              <p className="panel-filtros__aviso">
                Se muestran los alojamientos que tienen todas las características
                elegidas.
              </p>
            )}
          </>
        )}
      </section>
    </aside>
  );
}

/** Texto del rango de precio elegido, para el resumen de la búsqueda. */
export function textoDePrecio({ precioMinimo, precioMaximo }) {
  const desde = formatearPrecio(precioMinimo);
  const hasta = formatearPrecio(precioMaximo);
  if (desde && hasta) return `${desde} a ${hasta}`;
  if (desde) return `desde ${desde}`;
  if (hasta) return `hasta ${hasta}`;
  return "";
}
