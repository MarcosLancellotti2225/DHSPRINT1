import { useCallback, useEffect, useRef, useState } from "react";
import Buscador from "../components/Buscador";
import Categorias from "../components/Categorias";
import ProductoCard from "../components/ProductoCard";
import Paginacion from "../components/Paginacion";
import { listarProductos, listarProductosAleatorios, TAMANIO_PAGINA } from "../api/productos";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Home.css";

export default function Home() {
  useTituloPagina("Tu próxima estadía, en un clic");

  const [recomendados, setRecomendados] = useState([]);
  const [cargandoRecomendados, setCargandoRecomendados] = useState(true);

  const [pagina, setPagina] = useState(0);
  const [datosPagina, setDatosPagina] = useState(null);
  const [cargandoPagina, setCargandoPagina] = useState(true);

  const [error, setError] = useState("");
  const listadoRef = useRef(null);

  // Recomendaciones: 10 productos aleatorios, se piden una sola vez por visita.
  useEffect(() => {
    let vigente = true;

    listarProductosAleatorios(10)
      .then((datos) => vigente && setRecomendados(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudieron cargar las recomendaciones")))
      .finally(() => vigente && setCargandoRecomendados(false));

    return () => {
      vigente = false;
    };
  }, []);

  // Listado completo paginado, de a 10 por página.
  useEffect(() => {
    let vigente = true;
    setCargandoPagina(true);

    listarProductos(pagina, TAMANIO_PAGINA)
      .then((datos) => vigente && setDatosPagina(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el listado de alojamientos")))
      .finally(() => vigente && setCargandoPagina(false));

    return () => {
      vigente = false;
    };
  }, [pagina]);

  const cambiarPagina = useCallback((nueva) => {
    setPagina(nueva);
    listadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="home">
      <Buscador />
      <Categorias />

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
        <h2 id="listado-titulo" className="titulo-seccion">
          Todos los alojamientos
        </h2>

        {cargandoPagina ? (
          <p className="estado-vacio">Cargando alojamientos…</p>
        ) : !datosPagina || datosPagina.contenido.length === 0 ? (
          <p className="estado-vacio">Todavía no hay alojamientos cargados.</p>
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
