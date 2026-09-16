import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import ModalConfirmacion from "../components/ModalConfirmacion";
import ImagenProducto from "../components/ImagenProducto";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from "../api/categorias";
import { erroresPorCampo, mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

const FORMULARIO_VACIO = { titulo: "", descripcion: "", imagen: "" };

export default function AdminCategorias() {
  useTituloPagina("Agregar categoría");

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [erroresCampo, setErroresCampo] = useState({});

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setCategorias(await listarCategorias());
    } catch (e) {
      setError(mensajeDeError(e, "No se pudieron cargar las categorías"));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
    setErroresCampo((previos) => ({ ...previos, [name]: undefined }));
  }

  function empezarEdicion(categoria) {
    setEditando(categoria);
    setFormulario({
      titulo: categoria.titulo,
      descripcion: categoria.descripcion,
      imagen: categoria.imagen,
    });
    setError("");
    setAviso("");
    setErroresCampo({});
  }

  function cancelarEdicion() {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErroresCampo({});
  }

  function validar() {
    const errores = {};
    if (!formulario.titulo.trim()) errores.titulo = "El título es obligatorio";
    if (!formulario.descripcion.trim()) errores.descripcion = "La descripción es obligatoria";
    if (!formulario.imagen.trim()) errores.imagen = "La imagen es obligatoria";
    return errores;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setError("");
    setAviso("");

    const erroresLocales = validar();
    if (Object.keys(erroresLocales).length > 0) {
      setErroresCampo(erroresLocales);
      return;
    }
    setErroresCampo({});

    setGuardando(true);
    try {
      if (editando) {
        await actualizarCategoria(editando.id, formulario);
        setAviso(`Se actualizó la categoría "${formulario.titulo}".`);
      } else {
        await crearCategoria(formulario);
        setAviso(`Se agregó la categoría "${formulario.titulo}".`);
      }
      cancelarEdicion();
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo guardar la categoría"));
      setErroresCampo(erroresPorCampo(e));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    setEliminando(true);
    setError("");
    try {
      await eliminarCategoria(aEliminar.id);
      setAviso(`Se eliminó la categoría "${aEliminar.titulo}".`);
      setAEliminar(null);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo eliminar la categoría"));
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const acciones = (
    <Link to="/administracion" className="btn btn-secondary">
      ← Volver al panel
    </Link>
  );

  return (
    <PanelAdmin titulo="Agregar categoría" acciones={acciones}>
      {aviso && <p className="mensaje mensaje--exito">{aviso}</p>}
      {error && <p className="mensaje mensaje--error">{error}</p>}

      <form className="admin__formulario" onSubmit={alEnviar} noValidate>
        <h2 className="titulo-seccion">
          {editando ? `Editar "${editando.titulo}"` : "Nueva categoría"}
        </h2>

        <div className="field admin__campo">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            name="titulo"
            className="input"
            type="text"
            maxLength={100}
            placeholder="Ej: Hoteles"
            value={formulario.titulo}
            onChange={alCambiar}
          />
          {erroresCampo.titulo && <span className="admin__error-campo">{erroresCampo.titulo}</span>}
        </div>

        <div className="field admin__campo">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            className="input"
            rows={3}
            maxLength={1000}
            placeholder="Qué tipo de alojamientos agrupa"
            value={formulario.descripcion}
            onChange={alCambiar}
          />
          {erroresCampo.descripcion && (
            <span className="admin__error-campo">{erroresCampo.descripcion}</span>
          )}
        </div>

        <div className="field admin__campo">
          <label htmlFor="imagen">Imagen representativa</label>
          <input
            id="imagen"
            name="imagen"
            className="input"
            type="text"
            maxLength={500}
            placeholder="https://… o /uploads/archivo.png"
            value={formulario.imagen}
            onChange={alCambiar}
          />
          <span className="admin__ayuda">
            Dirección de la imagen. Puede ser una URL externa o una ruta servida por el backend.
          </span>
          {erroresCampo.imagen && <span className="admin__error-campo">{erroresCampo.imagen}</span>}
        </div>

        <div className="admin__acciones-formulario">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Agregar categoría"}
          </button>
          {editando && (
            <button type="button" className="btn btn-secondary" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <hr className="hr" />

      {cargando ? (
        <p className="estado-vacio">Cargando categorías…</p>
      ) : categorias.length === 0 ? (
        <p className="estado-vacio">Todavía no hay categorías cargadas.</p>
      ) : (
        <div className="admin__tabla-contenedor">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Imagen</th>
                <th scope="col">Título</th>
                <th scope="col">Descripción</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>
                    <ImagenProducto
                      url={categoria.imagen}
                      alt={categoria.titulo}
                      className="admin__miniatura"
                      loading="lazy"
                    />
                  </td>
                  <td>{categoria.titulo}</td>
                  <td className="admin__celda-larga">{categoria.descripcion}</td>
                  <td className="admin__acciones-fila">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => empezarEdicion(categoria)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setAviso("");
                        setAEliminar(categoria);
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo="Eliminar categoría"
          mensaje={`¿Confirmás que querés eliminar «${aEliminar.titulo}»? Los alojamientos que la tengan quedan sin categoría.`}
          textoConfirmar="Eliminar"
          procesando={eliminando}
          onConfirmar={confirmarEliminacion}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </PanelAdmin>
  );
}
