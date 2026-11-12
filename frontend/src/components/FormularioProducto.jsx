import { useRef, useState } from "react";
import IconoCaracteristica from "./IconoCaracteristica";
import "../styles/Admin.css";

/** Tope por archivo, el mismo que acepta el backend. */
export const TAMANIO_MAXIMO_MB = 10;
const TAMANIO_MAXIMO = TAMANIO_MAXIMO_MB * 1024 * 1024;

/** Pasa 2621440 a "2,5 MB", para poder decirle al usuario cuánto pesa su archivo. */
export function enMegas(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Mismas reglas que valida el backend, para avisar antes de mandar el formulario y
 * no hacer ir y volver al servidor por un campo vacío.
 */
export function validarProducto({ nombre, descripcion, capacidad, precioPorNoche, ciudadId, categoriaId }) {
  const errores = {};

  if (!nombre.trim()) {
    errores.nombre = "El nombre es obligatorio";
  } else if (nombre.trim().length < 5) {
    errores.nombre = "El nombre tiene que tener al menos 5 caracteres";
  }

  if (!descripcion.trim()) {
    errores.descripcion = "La descripción es obligatoria";
  } else if (descripcion.trim().length < 20) {
    errores.descripcion = "La descripción tiene que tener al menos 20 caracteres";
  }

  if (!capacidad || Number(capacidad) < 1) {
    errores.capacidad = "Indicá cuántos huéspedes entran";
  } else if (Number(capacidad) > 20) {
    errores.capacidad = "La capacidad no puede superar los 20 huéspedes";
  }

  const precio = Number(precioPorNoche);
  if (precioPorNoche === "" || precioPorNoche === null || precioPorNoche === undefined) {
    errores.precioPorNoche = "Indicá el precio por noche";
  } else if (Number.isNaN(precio) || precio <= 0) {
    errores.precioPorNoche = "El precio por noche tiene que ser mayor a cero";
  }

  // Sin ciudad ni categoría el alojamiento no entra en la búsqueda ni en el filtro.
  if (!ciudadId) errores.ciudadId = "Elegí la ciudad del alojamiento";
  if (!categoriaId) errores.categoriaId = "Elegí la categoría del alojamiento";

  return errores;
}

/** Revisa cada archivo y arma un aviso que nombra al que se pasa del límite. */
export function validarImagenes(imagenes, obligatorias) {
  if (imagenes.length === 0) {
    return obligatorias ? "Se debe cargar al menos una imagen del alojamiento." : "";
  }

  const pesadas = imagenes.filter((imagen) => imagen.size > TAMANIO_MAXIMO);
  if (pesadas.length === 0) return "";

  const detalle = pesadas.map((i) => `"${i.name}" (${enMegas(i.size)})`).join(", ");
  return pesadas.length === 1
    ? `El archivo ${detalle} supera los ${TAMANIO_MAXIMO_MB} MB. Elegí una imagen más liviana.`
    : `Estos archivos superan los ${TAMANIO_MAXIMO_MB} MB: ${detalle}. Elegí imágenes más livianas.`;
}

/**
 * Formulario compartido por el alta y la edición de un alojamiento. La diferencia
 * entre los dos casos es sólo si las imágenes son obligatorias: al editar, no
 * elegir ninguna significa conservar las que ya tenía.
 */
export default function FormularioProducto({
  valoresIniciales = {
    nombre: "",
    descripcion: "",
    capacidad: 2,
    precioPorNoche: "",
    ciudadId: "",
    categoriaId: "",
    caracteristicaIds: [],
  },
  ciudades = [],
  categorias = [],
  caracteristicas = [],
  imagenesObligatorias = true,
  ayudaImagenes,
  textoBoton = "Guardar producto",
  textoGuardando = "Guardando…",
  guardando = false,
  erroresCampo = {},
  onEnviar,
}) {
  const [formulario, setFormulario] = useState({
    nombre: valoresIniciales.nombre,
    descripcion: valoresIniciales.descripcion,
    capacidad: valoresIniciales.capacidad ?? 2,
    precioPorNoche: valoresIniciales.precioPorNoche ?? "",
    ciudadId: valoresIniciales.ciudadId ?? "",
    categoriaId: valoresIniciales.categoriaId ?? "",
  });
  const [seleccionadas, setSeleccionadas] = useState(valoresIniciales.caracteristicaIds ?? []);
  const [imagenes, setImagenes] = useState([]);
  const [errorImagenes, setErrorImagenes] = useState("");
  const [errores, setErrores] = useState({});
  const formularioRef = useRef(null);

  // Los errores del backend llegan por props; los de acá, del estado. Se muestran igual.
  const errorDe = (campo) => errores[campo] ?? erroresCampo[campo];

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
    // El error del campo se va apenas se lo corrige.
    setErrores((previos) => ({ ...previos, [name]: undefined }));
  }

  /** Lleva el foco al primer campo con problema: si no, el error pasa desapercibido. */
  function enfocar(campo) {
    const control = formularioRef.current?.querySelector(`[name="${campo}"]`);
    control?.focus();
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function alternarCaracteristica(id) {
    setSeleccionadas((previas) =>
      previas.includes(id) ? previas.filter((otra) => otra !== id) : [...previas, id]
    );
  }

  function alElegirImagenes(evento) {
    const elegidas = Array.from(evento.target.files ?? []);
    setImagenes(elegidas);
    // Se avisa del archivo pesado al elegirlo, no recién al enviar.
    setErrorImagenes(validarImagenes(elegidas, false));
  }

  function alEnviarFormulario(evento) {
    evento.preventDefault();

    const encontrados = validarProducto(formulario);
    const problemaConImagenes = validarImagenes(imagenes, imagenesObligatorias);

    setErrores(encontrados);
    setErrorImagenes(problemaConImagenes);

    const primerCampo = Object.keys(encontrados)[0];
    if (primerCampo) {
      enfocar(primerCampo);
      return;
    }
    if (problemaConImagenes) {
      enfocar("imagenes");
      return;
    }

    onEnviar({
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      capacidad: Number(formulario.capacidad),
      precioPorNoche: Number(formulario.precioPorNoche),
      ciudadId: formulario.ciudadId,
      categoriaId: formulario.categoriaId,
      caracteristicaIds: seleccionadas,
      imagenes,
    });
  }

  return (
    <>
      <form className="admin__formulario" ref={formularioRef} onSubmit={alEnviarFormulario} noValidate>
        <div className="field admin__campo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            className="input"
            type="text"
            maxLength={150}
            placeholder="Ej: Hotel Costanera"
            value={formulario.nombre}
            onChange={alCambiar}
            aria-invalid={Boolean(errorDe("nombre"))}
            aria-describedby={errorDe("nombre") ? "error-nombre" : undefined}
          />
          {errorDe("nombre") && (
            <span className="admin__error-campo" id="error-nombre" role="alert">
              {errorDe("nombre")}
            </span>
          )}
        </div>

        <div className="field admin__campo">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            className="input"
            rows={4}
            maxLength={4000}
            placeholder="Describí el alojamiento"
            value={formulario.descripcion}
            onChange={alCambiar}
            aria-invalid={Boolean(errorDe("descripcion"))}
            aria-describedby={errorDe("descripcion") ? "error-descripcion" : undefined}
          />
          {errorDe("descripcion") && (
            <span className="admin__error-campo" id="error-descripcion" role="alert">
              {errorDe("descripcion")}
            </span>
          )}
        </div>

        <div className="field admin__campo">
          <label htmlFor="capacidad">Capacidad (huéspedes)</label>
          <input
            id="capacidad"
            name="capacidad"
            className="input"
            type="number"
            min="1"
            max="20"
            value={formulario.capacidad}
            onChange={alCambiar}
            aria-invalid={Boolean(errorDe("capacidad"))}
            aria-describedby={errorDe("capacidad") ? "error-capacidad" : undefined}
          />
          <span className="admin__ayuda">
            Cuántas personas entran. El buscador filtra por este dato.
          </span>
          {errorDe("capacidad") && (
            <span className="admin__error-campo" id="error-capacidad" role="alert">
              {errorDe("capacidad")}
            </span>
          )}
        </div>

        <div className="field admin__campo">
          <label htmlFor="precioPorNoche">Precio por noche</label>
          <input
            id="precioPorNoche"
            name="precioPorNoche"
            className="input"
            type="number"
            min="1"
            step="0.01"
            placeholder="Por ejemplo, 85000"
            value={formulario.precioPorNoche}
            onChange={alCambiar}
            aria-invalid={Boolean(errorDe("precioPorNoche"))}
            aria-describedby={errorDe("precioPorNoche") ? "error-precioPorNoche" : undefined}
          />
          <span className="admin__ayuda">
            En pesos, por noche. El buscador deja filtrar por rango de precio.
          </span>
          {errorDe("precioPorNoche") && (
            <span className="admin__error-campo" id="error-precioPorNoche" role="alert">
              {errorDe("precioPorNoche")}
            </span>
          )}
        </div>

        <div className="field admin__campo">
          <label htmlFor="ciudadId">Ciudad</label>
          <select
            id="ciudadId"
            name="ciudadId"
            className="input"
            value={formulario.ciudadId}
            onChange={alCambiar}
            aria-invalid={Boolean(errorDe("ciudadId"))}
            aria-describedby={errorDe("ciudadId") ? "error-ciudad" : undefined}
          >
            <option value="">Elegí una ciudad</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre}, {ciudad.pais}
              </option>
            ))}
          </select>
          <span className="admin__ayuda">
            Sin ciudad, el alojamiento no aparece en las búsquedas por destino.
          </span>
          {errorDe("ciudadId") && (
            <span className="admin__error-campo" id="error-ciudad" role="alert">
              {errorDe("ciudadId")}
            </span>
          )}
        </div>

        <div className="field admin__campo">
          <label htmlFor="categoriaId">Categoría</label>
          <select
            id="categoriaId"
            name="categoriaId"
            className="input"
            value={formulario.categoriaId}
            onChange={alCambiar}
            aria-invalid={Boolean(errorDe("categoriaId"))}
            aria-describedby={errorDe("categoriaId") ? "error-categoria" : undefined}
          >
            <option value="">Elegí una categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.titulo}
              </option>
            ))}
          </select>
          <span className="admin__ayuda">
            Sin categoría, el alojamiento queda fuera del filtro del home.
          </span>
          {errorDe("categoriaId") && (
            <span className="admin__error-campo" id="error-categoria" role="alert">
              {errorDe("categoriaId")}
            </span>
          )}
        </div>

        <fieldset className="admin__campo admin__fieldset">
          <legend>Características</legend>
          {caracteristicas.length === 0 ? (
            <span className="admin__ayuda">
              Todavía no hay características cargadas. Se administran desde el panel.
            </span>
          ) : (
            <ul className="admin__caracteristicas">
              {caracteristicas.map((caracteristica) => (
                <li key={caracteristica.id}>
                  <label className="admin__caracteristica">
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(caracteristica.id)}
                      onChange={() => alternarCaracteristica(caracteristica.id)}
                    />
                    <IconoCaracteristica icono={caracteristica.icono} tamanio={18} />
                    <span>{caracteristica.nombre}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <div className="field admin__campo">
          <label htmlFor="imagenes">Imágenes</label>
          <input
            id="imagenes"
            name="imagenes"
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={alElegirImagenes}
            aria-invalid={Boolean(errorImagenes)}
            aria-describedby={errorImagenes ? "error-imagenes" : undefined}
          />
          {errorImagenes && (
            <span className="admin__error-campo" id="error-imagenes" role="alert">
              {errorImagenes}
            </span>
          )}
          <span className="admin__ayuda">
            {ayudaImagenes ??
              "Se pueden seleccionar varias a la vez. Para la galería del detalle se recomiendan al menos cinco."}
          </span>

          {imagenes.length > 0 && (
            <ul className="admin__lista-archivos">
              {imagenes.map((imagen) => (
                <li key={imagen.name} className={imagen.size > TAMANIO_MAXIMO ? "admin__archivo--pesado" : ""}>
                  {imagen.name} · {enMegas(imagen.size)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin__acciones-formulario">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? textoGuardando : textoBoton}
          </button>
        </div>
      </form>
    </>
  );
}
