import { useCallback, useEffect, useRef, useState } from "react";
import Buscador from "../components/Buscador";
import Categorias from "../components/Categorias";
import ProductoCard from "../components/ProductoCard";
import Paginacion from "../components/Paginacion";
import { listarProductos, listarProductosAleatorios, TAMANIO_PAGINA } from "../api/productos";
import { listarCategorias } from "../api/categorias";
import { listarCiudades } from "../api/ciudades";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Home.css";

const RECOMENDADOS = 10;

/**
 * Home del sitio: buscador, categorías, recomendaciones y el listado de alojamientos.
 *
 * El listado muestra el catálogo completo y, al buscar un destino, pasa a mostrar los
 * resultados de esa búsqueda. Las categorías y las recomendaciones quedan siempre
 * visibles, antes y después de buscar, como está definido para la página de inicio.
 */
export default function Home() {
  useTituloPagina("Tu próxima estadía, en un clic");

  const [ciudades, setCiudades] = useState([]);
  const [cargandoCiudades, setCargandoCiudades] = useState(true);

  const [recomendados, setRecomendados] = useState([]);
  const [cargandoRecomendados, setCargandoRecomendados] = useState(true);

  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [seleccionadas, setSeleccionadas] = useState([]);

  // null mientras no se haya buscado ningún destino.
  const [busqueda, setBusqueda] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [datosPagina, setDatosPagina] = useState(null);
  const [cargandoPagina, setCargandoPagina] = useState(true);

  const [error, setError] = useState("");
  const listadoRef = useRef(null);

  useEffect(() => {
    let vigente = true;

    Promise.all([
      listarCiudades().catch(() => []),
      listarCategorias().catch(() => []),
      listarProductosAleatorios(RECOMENDADOS).catch((e) => {
        if (vigente) setError(mensajeDeError(e, "No se pudieron cargar las recomendaciones"));
        return [];
      }),
    ]).then(([lasCiudades, lasCategorias, losRecomendados]) => {
      if (!vigente) return;
      setCiudades(lasCiudades);
      setCategorias(lasCategorias);
      setRecomendados(losRecomendados);
      setCargandoCiudades(false);
      setCargandoCategorias(false);
      setCargandoRecomendados(false);
    });

    return () => {
      vigente = false;
    };
  }, []);

  // Listado de a 10. El destino y las categorías los resuelve el backend.
  useEffect(() => {
    let vigente = true;
    setCargandoPagina(true);

    listarProductos(pagina, TAMANIO_PAGINA, seleccionadas, busqueda?.ciudad?.id ?? null)
      .then((datos) => vigente && setDatosPagina(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el listado de alojamientos")))
      .finally(() => vigente && setCargandoPagina(false));

    return () => {
      vigente = false;
    };
  }, [pagina, seleccionadas, busqueda]);

  const buscar = useCallback((datos) => {
    setBusqueda(datos);
    setPagina(0);
    listadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const limpiarBusqueda = useCallback(() => {
    setBusqueda(null);
    setPagina(0);
  }, []);

  const cambiarPagina = useCallback((nueva) => {
    setPagina(nueva);
    listadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Al cambiar el filtro se vuelve a la primera página: la que se estaba viendo
  // puede no existir en el resultado filtrado.
  const alternarCategoria = useCallback((id) => {
    setPagina(0);
    setSeleccionadas((previas) =>
      previas.includes(id) ? previas.filter((otra) => otra !== id) : [...previas, id]
    );
  }, []);

  const limpiarFiltros = useCallback(() => {
    setPagina(0);
    setSeleccionadas([]);
  }, []);

  const hayFiltro = seleccionadas.length > 0;

  return (
    <div className="home">
      <Buscador ciudades={ciudades} cargandoCiudades={cargandoCiudades} onBuscar={buscar} />

      <Categorias
        categorias={categorias}
        seleccionadas={seleccionadas}
        onAlternar={alternarCategoria}
        onLimpiar={limpiarFiltros}
        cantidadFiltrada={datosPagina?.totalElementos ?? 0}
        totalProductos={datosPagina?.totalSinFiltro ?? 0}
        nombreDelConjunto={busqueda?.ciudad?.nombre}
        cargando={cargandoCategorias}
      />

      <section className="home__bloque" aria-labelledby="recomendaciones-titulo">
        <div className="home__encabezado">
          <h2 id="recomendaciones-titulo" className="titulo-seccion home__titulo">
            Recomendados para vos
          </h2>
          <span className="tag tag-outline">Aleatorio</span>
        </div>

        {error && <p className="mensaje mensaje--error">{error}</p>}

        {cargandoRecomendados ? (
          <p className="estado-vacio">Cargando recomendaciones…</p>
        ) : recomendados.length === 0 ? (
          <p className="estado-vacio">Todavía no hay alojamientos cargados.</p>
        ) : (
          <ul className="nh-products">
            {recomendados.map((producto) => (
              <li key={producto.id}>
                <ProductoCard producto={producto} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home__bloque" aria-labelledby="listado-titulo" ref={listadoRef}>
        <div className="home__encabezado">
          <h2 id="listado-titulo" className="titulo-seccion home__titulo">
            {busqueda ? `Alojamientos en ${busqueda.ciudad.nombre}` : "Todos los alojamientos"}
          </h2>
          {busqueda && (
            <button type="button" className="btn btn-ghost" onClick={limpiarBusqueda}>
              Ver todos los destinos
            </button>
          )}
        </div>

        {cargandoPagina ? (
          <p className="estado-vacio">Buscando alojamientos…</p>
        ) : !datosPagina || datosPagina.contenido.length === 0 ? (
          <p className="estado-vacio">
            {busqueda
              ? `No encontramos alojamientos en ${busqueda.ciudad.nombre}${
                  hayFiltro ? " para las categorías elegidas" : ""
                }.`
              : hayFiltro
                ? "Ningún alojamiento coincide con las categorías elegidas."
                : "Todavía no hay alojamientos cargados."}
          </p>
        ) : (
          <>
            <ul className="nh-products">
              {datosPagina.contenido.map((producto) => (
                <li key={producto.id}>
                  <ProductoCard producto={producto} />
                </li>
              ))}
            </ul>

            <Paginacion
              pagina={datosPagina.pagina}
              totalPaginas={datosPagina.totalPaginas}
              onCambiarPagina={cambiarPagina}
            />
          </>
        )}
      </section>
    </div>
  );
}
