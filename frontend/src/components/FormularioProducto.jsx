import { useState } from "react";
import IconoCaracteristica from "./IconoCaracteristica";
import "../styles/Admin.css";

/**
 * Formulario compartido por el alta y la edición de un alojamiento. La diferencia
 * entre los dos casos es sólo si las imágenes son obligatorias: al editar, no
 * elegir ninguna significa conservar las que ya tenía.
 */
export default function FormularioProducto({
  valoresIniciales = { nombre: "", descripcion: "", categoriaId: "", caracteristicaIds: [] },
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
    categoriaId: valoresIniciales.categoriaId ?? "",
  });
  const [seleccionadas, setSeleccionadas] = useState(valoresIniciales.caracteristicaIds ?? []);
  const [imagenes, setImagenes] = useState([]);
  const [errorImagenes, setErrorImagenes] = useState("");

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
  }

  function alternarCaracteristica(id) {
    setSeleccionadas((previas) =>
      previas.includes(id) ? previas.filter((otra) => otra !== id) : [...previas, id]
    );
  }

  function alElegirImagenes(evento) {
    setImagenes(Array.from(evento.target.files ?? []));
    setErrorImagenes("");
  }

  function alEnviarFormulario(evento) {
    evento.preventDefault();

    if (imagenesObligatorias && imagenes.length === 0) {
      setErrorImagenes("Se debe cargar al menos una imagen del alojamiento.");
      return;
    }

    onEnviar({
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      categoriaId: formulario.categoriaId || null,
      caracteristicaIds: seleccionadas,
      imagenes,
    });
  }

  return (
    <>
      {errorImagenes && <p className="mensaje mensaje--error">{errorImagenes}</p>}

      <form className="admin__formulario" onSubmit={alEnviarFormulario} noValidate>
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
            required
          />
          {erroresCampo.nombre && <span className="admin__error-campo">{erroresCampo.nombre}</span>}
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
            required
          />
          {erroresCampo.descripcion && (
            <span className="admin__error-campo">{erroresCampo.descripcion}</span>
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
          >
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.titulo}
              </option>
            ))}
          </select>
          {erroresCampo.categoriaId && (
            <span className="admin__error-campo">{erroresCampo.categoriaId}</span>
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
          />
          <span className="admin__ayuda">
            {ayudaImagenes ??
              "Se pueden seleccionar varias a la vez. Para la galería del detalle se recomiendan al menos cinco."}
          </span>

          {imagenes.length > 0 && (
            <ul className="admin__lista-archivos">
              {imagenes.map((imagen) => (
                <li key={imagen.name}>{imagen.name}</li>
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
