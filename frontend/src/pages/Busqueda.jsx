import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Buscador from "../components/Buscador";
import PanelDeFiltros, { textoDePrecio } from "../components/PanelDeFiltros";
import ProductoCard from "../components/ProductoCard";
import Paginacion from "../components/Paginacion";
import { buscarProductos, TAMANIO_PAGINA } from "../api/productos";
import { listarCategorias } from "../api/categorias";
import { listarCiudades } from "../api/ciudades";
import { listarCaracteristicas } from "../api/caracteristicas";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import useValorDemorado from "../hooks/useValorDemorado";
import {
  cantidadDeFiltros,
  escribirFiltros,
  leerFiltros,
  leerPagina,
} from "../utils/filtrosDeBusqueda";
import "../styles/Busqueda.css";

/**
 * Cuánto se espera, sin que el usuario toque nada, antes de buscar. Lo bastante
 * para encadenar varios clicks en una sola búsqueda, lo bastante poco para que
 * no se sienta que la página se quedó colgada.
 */
const ESPERA_ANTES_DE_BUSCAR = 400;

/** Todo menos el destino: es lo que borra "Limpiar todo". */
const FILTROS_SIN_DESTINO = {
  entrada: "",
  salida: "",
  huespedes: 0,
  categorias: [],
  precioMinimo: "",
  precioMaximo: "",
  caracteristicas: [],
};

/** Arma el texto que resume qué se está buscando, a partir de los filtros. */
export function resumenDeBusqueda(filtros, { ciudad, categorias = [], caracteristicas = [] }) {
  const partes = [];

  if (filtros.entrada && filtros.salida) {
    partes.push(`del ${filtros.entrada} al ${filtros.salida}`);
  }
  if (filtros.huespedes > 0) {
    partes.push(`${filtros.huespedes} ${filtros.huespedes === 1 ? "huésped" : "huéspedes"}`);
  }

  const precio = textoDePrecio(filtros);
  if (precio) partes.push(precio);

  const nombresDeCategorias = categorias
    .filter((categoria) => filtros.categorias.includes(categoria.id))
    .map((categoria) => categoria.titulo);
  if (nombresDeCategorias.length > 0) partes.push(nombresDeCategorias.join(", "));

  const nombresDeCaracteristicas = caracteristicas
    .filter((caracteristica) => filtros.caracteristicas.includes(caracteristica.id))
    .map((caracteristica) => caracteristica.nombre);
  if (nombresDeCaracteristicas.length > 0) partes.push(nombresDeCaracteristicas.join(", "));

  const destino = ciudad ? `Alojamientos en ${ciudad.nombre}` : "Todos los alojamientos";
  return partes.length > 0 ? `${destino} · ${partes.join(" · ")}` : destino;
}

/**
 * Página de búsqueda: el buscador arriba, los filtros a la izquierda y los
 * resultados a la derecha.
 *
 * Los filtros viven en la URL (`/busqueda?ciudad=3&huespedes=4`) y no en el estado
 * del componente. Eso hace que la búsqueda se pueda compartir por link, que el
 * botón "atrás" deshaga el último filtro y que recargar no pierda nada. El efecto
 * que trae los resultados depende sólo de la query string, así que no hace falta
 * sincronizar dos fuentes de verdad.
 */
export default function Busqueda() {
  const [parametros, setParametros] = useSearchParams();

  const filtros = useMemo(() => leerFiltros(parametros), [parametros]);
  const pagina = useMemo(() => leerPagina(parametros), [parametros]);

  const [ciudades, setCiudades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const resultadosRef = useRef(null);
  const [datosPagina, setDatosPagina] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const ciudad = ciudades.find((otra) => otra.id === filtros.ciudadId);
  const cantidad = cantidadDeFiltros(filtros);

  useTituloPagina(ciudad ? `Alojamientos en ${ciudad.nombre}` : "Búsqueda de alojamientos");

  // Los catálogos de los filtros se piden una sola vez: no dependen de la búsqueda.
  useEffect(() => {
    let vigente = true;

    Promise.all([
      listarCiudades().catch(() => []),
      listarCategorias().catch(() => []),
      listarCaracteristicas().catch(() => []),
    ]).then(([lasCiudades, lasCategorias, lasCaracteristicas]) => {
      if (!vigente) return;
      setCiudades(lasCiudades);
      setCategorias(lasCategorias);
      setCaracteristicas(lasCaracteristicas);
      setCargandoCatalogos(false);
    });

    return () => {
      vigente = false;
    };
  }, []);

  // Una sola dependencia: la query string. Cualquier cambio de filtro o de página
  // pasa por la URL, así que acá no hay nada más que escuchar.
  const query = parametros.toString();

  // La URL se actualiza con cada click, pero la búsqueda espera a que el usuario
  // deje de tocar filtros. Tildar tres características seguidas es una búsqueda,
  // no tres, y la lista no parpadea una vez por click.
  const queryDemorada = useValorDemorado(query, ESPERA_ANTES_DE_BUSCAR);
  // El usuario ya cambió algo pero la búsqueda todavía no salió.
  const esperando = query !== queryDemorada;

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");

    // Los criterios salen de la query demorada, no de `filtros`: si no, el efecto
    // buscaría con los filtros nuevos antes de que la espera termine.
    const parametrosDemorados = new URLSearchParams(queryDemorada);
    const criterios = leerFiltros(parametrosDemorados);

    buscarProductos({
      pagina: leerPagina(parametrosDemorados),
      tamanio: TAMANIO_PAGINA,
      ciudadId: criterios.ciudadId,
      categorias: criterios.categorias,
      entrada: criterios.entrada,
      salida: criterios.salida,
      huespedes: criterios.huespedes,
      precioMinimo: criterios.precioMinimo,
      precioMaximo: criterios.precioMaximo,
      caracteristicas: criterios.caracteristicas,
    })
      .then((datos) => vigente && setDatosPagina(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo completar la búsqueda")))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [queryDemorada]);

  /**
   * Aplica un cambio parcial de filtros y vuelve a la primera página: la que se
   * estaba viendo puede no existir en el resultado nuevo.
   */
  const cambiarFiltros = useCallback(
    (cambios) => {
      setParametros(escribirFiltros({ ...filtros, ...cambios }, 0));
    },
    [filtros, setParametros]
  );

  const limpiar = useCallback(() => {
    // Se conserva el destino: limpiar los filtros no es empezar la búsqueda de nuevo.
    setParametros(escribirFiltros({ ...filtros, ...FILTROS_SIN_DESTINO }, 0));
  }, [filtros, setParametros]);

  // Al cambiar de página la vista vuelve al principio de los resultados: sin esto
  // la página nueva arranca mostrando el final de la lista anterior.
  const cambiarPagina = useCallback(
    (nueva) => {
      setParametros(escribirFiltros(filtros, nueva));
      resultadosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [filtros, setParametros]
  );

  // El buscador de arriba reemplaza destino, fechas y huéspedes, y deja en pie
  // los filtros de la columna: cambiar de destino no debería soltar el precio.
  const buscarDeNuevo = useCallback(
    (datos) => {
      setParametros(
        escribirFiltros(
          {
            ...filtros,
            ciudadId: datos.ciudad?.id ?? null,
            entrada: datos.entrada ?? "",
            salida: datos.salida ?? "",
            huespedes: datos.huespedes ?? 0,
          },
          0
        )
      );
    },
    [filtros, setParametros]
  );

  const resumen = resumenDeBusqueda(filtros, { ciudad, categorias, caracteristicas });
  const resultados = datosPagina?.contenido ?? [];
  const total = datosPagina?.totalElementos ?? 0;

  // Hay algo en curso: o la espera antes de buscar, o la búsqueda misma.
  const ocupado = cargando || esperando;
  // Sin resultados previos no hay nada que atenuar: van los esqueletos.
  const primeraCarga = ocupado && datosPagina === null;

  return (
    <div className="busqueda">
      <Buscador
        ciudades={ciudades}
        cargandoCiudades={cargandoCatalogos}
        onBuscar={buscarDeNuevo}
        valoresIniciales={{
          ciudad,
          entrada: filtros.entrada,
          salida: filtros.salida,
          huespedes: filtros.huespedes,
        }}
      />

      <div className="busqueda__cuerpo">
        <PanelDeFiltros
          filtros={filtros}
          categorias={categorias}
          caracteristicas={caracteristicas}
          cargando={cargandoCatalogos}
          onCambiar={cambiarFiltros}
          onLimpiar={limpiar}
          hayFiltros={cantidad > 0}
        />

        <section
          className="busqueda__resultados"
          aria-labelledby="resultados-titulo"
          ref={resultadosRef}
        >
          <div className="busqueda__encabezado">
            <h2 id="resultados-titulo" className="titulo-seccion busqueda__titulo">
              {resumen}
            </h2>
            <p className="busqueda__contador" aria-live="polite">
              {ocupado ? (
                <span className="busqueda__buscando">
                  <span className="busqueda__spinner" aria-hidden="true" />
                  Buscando…
                </span>
              ) : (
                `${total} ${total === 1 ? "alojamiento" : "alojamientos"}`
              )}
            </p>
          </div>

          {error && <p className="mensaje mensaje--error">{error}</p>}

          {primeraCarga ? (
            <EsqueletoDeResultados />
          ) : resultados.length === 0 ? (
            <SinResultados filtros={filtros} ciudad={ciudad} onCambiar={cambiarFiltros} onLimpiar={limpiar} />
          ) : (
            /*
             * Mientras se busca la lista anterior se queda puesta, atenuada. Si se
             * reemplazara por un cartel, la grilla desaparecería y la página daría
             * un salto en cada click: eso es lo que se veía feo.
             */
            <div className={`busqueda__listado${ocupado ? " busqueda__listado--ocupado" : ""}`}>
              <ul className="nh-products">
                {resultados.map((producto) => (
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Siluetas de tarjetas para la primera carga, cuando todavía no hay nada que
 * atenuar. Ocupan el lugar que van a ocupar los resultados, así la página no da
 * un salto cuando llegan.
 */
function EsqueletoDeResultados() {
  return (
    <ul className="nh-products" aria-hidden="true">
      {Array.from({ length: 4 }, (_, indice) => (
        <li key={indice}>
          <div className="card elev-sm esqueleto-tarjeta">
            <div className="esqueleto esqueleto-tarjeta__imagen" />
            <div className="esqueleto-tarjeta__cuerpo">
              <div className="esqueleto esqueleto-tarjeta__titulo" />
              <div className="esqueleto esqueleto-tarjeta__linea" />
              <div className="esqueleto esqueleto-tarjeta__linea esqueleto-tarjeta__linea--corta" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Qué mostrar cuando la búsqueda no trae nada. Decir cuál filtro la dejó vacía es
 * lo que permite corregirla: "no hay nada en Bariloche" y "no hay nada en Bariloche
 * para 10 huéspedes" se arreglan de maneras muy distintas.
 */
function SinResultados({ filtros, ciudad, onCambiar, onLimpiar }) {
  const atajos = [];

  if (filtros.huespedes > 1) {
    atajos.push({
      texto: "Buscar sin filtrar por huéspedes",
      accion: () => onCambiar({ huespedes: 0 }),
    });
  }
  if (filtros.entrada && filtros.salida) {
    atajos.push({
      texto: "Buscar sin fechas",
      accion: () => onCambiar({ entrada: "", salida: "" }),
    });
  }
  if (filtros.precioMinimo !== "" || filtros.precioMaximo !== "") {
    atajos.push({
      texto: "Quitar el rango de precio",
      accion: () => onCambiar({ precioMinimo: "", precioMaximo: "" }),
    });
  }
  if (filtros.caracteristicas.length > 0) {
    atajos.push({
      texto: "Quitar las características",
      accion: () => onCambiar({ caracteristicas: [] }),
    });
  }
  if (filtros.categorias.length > 0) {
    atajos.push({
      texto: "Quitar las categorías",
      accion: () => onCambiar({ categorias: [] }),
    });
  }

  return (
    <div className="busqueda__sin-resultados">
      <p className="estado-vacio">
        No encontramos alojamientos{ciudad ? ` en ${ciudad.nombre}` : ""} con estos filtros.
      </p>

      {atajos.length > 0 ? (
        <div className="busqueda__atajos">
          <p>Probá aflojando alguno:</p>
          <ul>
            {atajos.map((atajo) => (
              <li key={atajo.texto}>
                <button type="button" className="btn btn-ghost" onClick={atajo.accion}>
                  {atajo.texto}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="btn btn-ghost" onClick={onLimpiar}>
                Limpiar todos los filtros
              </button>
            </li>
          </ul>
        </div>
      ) : (
        <Link to="/" className="btn btn-secondary">
          Volver al inicio
        </Link>
      )}
    </div>
  );
}
