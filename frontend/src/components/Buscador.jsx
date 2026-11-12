import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/Buscador.css";

const HOY = new Date().toISOString().slice(0, 10);

const BUSQUEDA_VACIA = { destino: "", ciudadId: "", entrada: "", salida: "", huespedes: 2 };

/** Quita tildes y mayúsculas para que "bariloche" encuentre "Bariloche". */
export function normalizar(texto) {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Destinos cuyo nombre o país empiezan por lo tipeado, o lo contienen. */
export function sugerenciasPara(ciudades, texto) {
  const buscado = normalizar(texto);
  if (!buscado) return ciudades;

  return ciudades.filter((ciudad) => {
    const nombre = normalizar(ciudad.nombre);
    const pais = normalizar(ciudad.pais);
    return nombre.includes(buscado) || pais.includes(buscado);
  });
}

/**
 * Reglas de la búsqueda. El destino es lo único obligatorio: es lo que el backend
 * sabe filtrar. Las fechas son opcionales, pero si se cargan tienen que ser
 * coherentes entre sí.
 */
export function validarBusqueda({ ciudadId, entrada, salida }) {
  const errores = {};

  if (!ciudadId) {
    errores.destino = "Elegí un destino de la lista para buscar";
  }
  if (entrada && salida && salida <= entrada) {
    errores.salida = "El check-out tiene que ser posterior al check-in";
  }
  if (salida && !entrada) {
    errores.entrada = "Falta el check-in";
  }

  return errores;
}

/**
 * Arma el estado del formulario a partir de una búsqueda ya hecha, para que el
 * buscador de la página de resultados aparezca con lo que se buscó y no vacío.
 */
function formularioDesde(valores) {
  if (!valores) return BUSQUEDA_VACIA;
  return {
    destino: valores.ciudad ? `${valores.ciudad.nombre}, ${valores.ciudad.pais}` : "",
    ciudadId: valores.ciudad?.id ?? "",
    entrada: valores.entrada ?? "",
    salida: valores.salida ?? "",
    huespedes: valores.huespedes > 0 ? valores.huespedes : BUSQUEDA_VACIA.huespedes,
  };
}

export default function Buscador({
  ciudades = [],
  cargandoCiudades = false,
  onBuscar,
  valoresIniciales = null,
  titulo = "Buscá ofertas en hoteles, cabañas y mucho más",
  bajada = "Elegí tu destino y las fechas de tu estadía. Te mostramos los alojamientos disponibles para que compares y reserves en un clic.",
}) {
  const [formulario, setFormulario] = useState(() => formularioDesde(valoresIniciales));
  const [errores, setErrores] = useState({});
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const destinoRef = useRef(null);
  // focus() corre antes de que el re-render actualice `errores`, así que onFocus
  // leería el valor viejo y reabriría la lista justo sobre el mensaje de error.
  const hayErrorDeDestinoRef = useRef(false);
  const entradaRef = useRef(null);
  const salidaRef = useRef(null);

  // Las ciudades llegan por fetch, así que el nombre del destino elegido puede
  // aparecer después del primer render. Sin esto el campo quedaría vacío aunque la
  // URL tenga un destino.
  const ciudadInicial = valoresIniciales?.ciudad;
  const idInicial = ciudadInicial?.id;
  const nombreInicial = ciudadInicial ? `${ciudadInicial.nombre}, ${ciudadInicial.pais}` : "";
  useEffect(() => {
    if (!idInicial) return;
    setFormulario((previo) =>
      String(previo.ciudadId) === String(idInicial)
        ? previo
        : { ...previo, destino: nombreInicial, ciudadId: idInicial }
    );
  }, [idInicial, nombreInicial]);

  const sugerencias = useMemo(
    () => sugerenciasPara(ciudades, formulario.destino),
    [ciudades, formulario.destino]
  );

  // Cierra las sugerencias al hacer clic afuera.
  useEffect(() => {
    if (!abierto) return undefined;

    function alClickAfuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClickAfuera);
    return () => document.removeEventListener("mousedown", alClickAfuera);
  }, [abierto]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
    setErrores((previos) => ({ ...previos, [name]: undefined }));
  }

  function alEscribirDestino(evento) {
    const { value } = evento.target;
    // Al editar el texto se suelta la ciudad elegida: hay que volver a elegir una.
    setFormulario((previo) => ({ ...previo, destino: value, ciudadId: "" }));
    setErrores((previos) => ({ ...previos, destino: undefined }));
    hayErrorDeDestinoRef.current = false;
    setAbierto(true);
  }

  function elegirCiudad(ciudad) {
    setFormulario((previo) => ({
      ...previo,
      destino: `${ciudad.nombre}, ${ciudad.pais}`,
      ciudadId: ciudad.id,
    }));
    setErrores((previos) => ({ ...previos, destino: undefined }));
    setAbierto(false);
  }

  function alEnviar(evento) {
    evento.preventDefault();

    const encontrados = validarBusqueda(formulario);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      // La lista de sugerencias abierta tapa el mensaje: se cierra y se enfoca el
      // campo que falta, así el error se lee y se sabe dónde corregir.
      setAbierto(false);
      hayErrorDeDestinoRef.current = Boolean(encontrados.destino);
      if (encontrados.destino) destinoRef.current?.focus();
      else if (encontrados.entrada) entradaRef.current?.focus();
      else if (encontrados.salida) salidaRef.current?.focus();
      return;
    }

    setAbierto(false);
    const ciudad = ciudades.find((otra) => String(otra.id) === String(formulario.ciudadId));
    onBuscar({ ...formulario, huespedes: Number(formulario.huespedes) || 1, ciudad });
  }

  const mensaje = errores.destino ?? errores.entrada ?? errores.salida;

  return (
    <section className="card elev-md buscador" aria-labelledby="buscador-titulo">
      <h1 id="buscador-titulo" className="buscador__titulo">
        {titulo}
      </h1>
      <p className="buscador__bajada">{bajada}</p>

      <form className="buscador__formulario" onSubmit={alEnviar} noValidate>
        <div className="buscador__campos">
          <div className="field buscador__campo buscador__campo--destino" ref={contenedorRef}>
            <label htmlFor="destino">Destino</label>
            <input
              id="destino"
              name="destino"
              ref={destinoRef}
              className="input"
              type="text"
              autoComplete="off"
              placeholder={cargandoCiudades ? "Cargando destinos…" : "¿A dónde vas?"}
              disabled={cargandoCiudades}
              value={formulario.destino}
              onChange={alEscribirDestino}
              onFocus={() => {
                if (hayErrorDeDestinoRef.current) {
                  hayErrorDeDestinoRef.current = false;
                  return;
                }
                setAbierto(true);
              }}
              role="combobox"
              aria-expanded={abierto}
              aria-controls="sugerencias-destino"
              aria-autocomplete="list"
              aria-invalid={Boolean(errores.destino)}
            />

            {abierto && (
              <ul id="sugerencias-destino" className="buscador__sugerencias" role="listbox">
                {sugerencias.length === 0 ? (
                  <li className="buscador__sin-sugerencias">
                    No tenemos alojamientos en ese destino todavía.
                  </li>
                ) : (
                  sugerencias.map((ciudad) => (
                    <li key={ciudad.id}>
                      <button
                        type="button"
                        className="buscador__sugerencia"
                        role="option"
                        aria-selected={String(ciudad.id) === String(formulario.ciudadId)}
                        onClick={() => elegirCiudad(ciudad)}
                      >
                        <span className="buscador__sugerencia-nombre">{ciudad.nombre}</span>
                        <span className="buscador__sugerencia-pais">{ciudad.pais}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Calendario doble: dos campos de fecha que forman un rango. */}
          <div className="buscador__rango">
            <div className="field buscador__campo">
              <label htmlFor="entrada">Check-in</label>
              <input
                id="entrada"
                name="entrada"
                ref={entradaRef}
                className="input"
                type="date"
                min={HOY}
                value={formulario.entrada}
                onChange={alCambiar}
                aria-invalid={Boolean(errores.entrada)}
              />
            </div>

            <div className="field buscador__campo">
              <label htmlFor="salida">Check-out</label>
              <input
                id="salida"
                name="salida"
                ref={salidaRef}
                className="input"
                type="date"
                // No se puede salir antes de entrar.
                min={formulario.entrada || HOY}
                value={formulario.salida}
                onChange={alCambiar}
                aria-invalid={Boolean(errores.salida)}
              />
            </div>
          </div>

          <div className="field buscador__campo buscador__campo--huespedes">
            <label htmlFor="huespedes">Huéspedes</label>
            <input
              id="huespedes"
              name="huespedes"
              className="input"
              type="number"
              min="1"
              max="20"
              value={formulario.huespedes}
              onChange={alCambiar}
            />
          </div>

          <button type="submit" className="btn btn-primary buscador__enviar">
            Realizar búsqueda
          </button>
        </div>

        {mensaje && (
          <p className="buscador__error" role="alert">
            {mensaje}
          </p>
        )}
      </form>
    </section>
  );
}
