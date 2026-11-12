import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Buscador from "../components/Buscador";
import Categorias from "../components/Categorias";
import ProductoCard from "../components/ProductoCard";
import Paginacion from "../components/Paginacion";
import { listarProductos, listarProductosAleatorios, TAMANIO_PAGINA } from "../api/productos";
import { listarCategorias } from "../api/categorias";
import { listarCiudades } from "../api/ciudades";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import { escribirFiltros, FILTROS_VACIOS } from "../utils/filtrosDeBusqueda";
import "../styles/Home.css";

const RECOMENDADOS = 10;

/**
 * Home del sitio: buscador, categorías, recomendaciones y el catálogo de alojamientos.
 *
 * Buscar no filtra esta página: lleva a `/busqueda` con los criterios en la URL. Antes
 * los resultados aparecían acá abajo, debajo de las categorías y las recomendaciones,
 * y la búsqueda parecía no hacer nada porque el resultado caía fuera de la pantalla.
 * Con una página propia los resultados se ven de entrada, se pueden seguir filtrando
 * y la búsqueda queda en una URL que se puede compartir.
 */
export default function Home() {
  useTituloPagina("Tu próxima estadía, en un clic");
  const navegar = useNavigate();

  const [ciudades, setCiudades] = useState([]);
  const [cargandoCiudades, setCargandoCiudades] = useState(true);

  const [recomendados, setRecomendados] = useState([]);
  const [cargandoRecomendados, setCargandoRecomendados] = useState(true);

  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [seleccionadas, setSeleccionadas] = useState([]);

  const [pagina, setPagina] = useState(0);
  const [datosPagina, setDatosPagina] = useState(null);
  const [cargandoPagina, setCargandoPagina] = useState(true);

  const [error, setError] = useState("");

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

  // Catálogo de a 10, filtrable por categoría. El filtrado lo resuelve el backend.
  useEffect(() => {
    let vigente = true;
    setCargandoPagina(true);

    listarProductos(pagina, TAMANIO_PAGINA, seleccionadas)
      .then((datos) => vigente && setDatosPagina(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el listado de alojamientos")))
      .finally(() => vigente && setCargandoPagina(false));

    return () => {
      vigente = false;
    };
  }, [pagina, seleccionadas]);

  // Buscar no filtra la home: lleva a la página de búsqueda con los criterios
  // en la URL, donde se siguen filtrando.
  const buscar = useCallback(
    (datos) => {
      const filtros = {
        ...FILTROS_VACIOS,
        ciudadId: datos.ciudad?.id ?? null,
        entrada: datos.entrada ?? "",
        salida: datos.salida ?? "",
        huespedes: datos.huespedes ?? 0,
        // Las categorías elegidas en la home viajan con la búsqueda.
        categorias: seleccionadas,
      };
      navegar(`/busqueda?${escribirFiltros(filtros, 0)}`);
    },
    [navegar, seleccionadas]
  );

  const cambiarPagina = useCallback((nueva) => {
    setPagina(nueva);
    setCargandoPagina(true);
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

      <section className="home__bloque" aria-labelledby="listado-titulo">
        <div className="home__encabezado">
          <h2 id="listado-titulo" className="titulo-seccion home__titulo">
            Todos los alojamientos
          </h2>
        </div>

        {cargandoPagina ? (
          <p className="estado-vacio">Cargando alojamientos…</p>
        ) : !datosPagina || datosPagina.contenido.length === 0 ? (
          <div className="home__sin-resultados">
            <p className="estado-vacio">
              {hayFiltro
                ? "Ningún alojamiento coincide con las categorías elegidas."
                : "Todavía no hay alojamientos cargados."}
            </p>
            {hayFiltro && (
              <button type="button" className="btn btn-ghost" onClick={limpiarFiltros}>
                Quitar las categorías elegidas
              </button>
            )}
          </div>
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
