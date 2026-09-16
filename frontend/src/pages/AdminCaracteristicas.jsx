import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import ModalConfirmacion from "../components/ModalConfirmacion";
import IconoCaracteristica, { ICONOS_DISPONIBLES } from "../components/IconoCaracteristica";
import {
  actualizarCaracteristica,
  crearCaracteristica,
  eliminarCaracteristica,
  listarCaracteristicas,
} from "../api/caracteristicas";
import { erroresPorCampo, mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

const FORMULARIO_VACIO = { nombre: "", icono: ICONOS_DISPONIBLES[0] };

export default function AdminCaracteristicas() {
  useTituloPagina("Administrar características");

  const [caracteristicas, setCaracteristicas] = useState([]);
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
      setCaracteristicas(await listarCaracteristicas());
    } catch (e) {
      setError(mensajeDeError(e, "No se pudieron cargar las características"));
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

  function empezarEdicion(caracteristica) {
    setEditando(caracteristica);
    setFormulario({ nombre: caracteristica.nombre, icono: caracteristica.icono });
    setError("");
    setAviso("");
    setErroresCampo({});
  }

  function cancelarEdicion() {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErroresCampo({});
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setError("");
    setAviso("");
    setErroresCampo({});

    if (!formulario.nombre.trim()) {
      setErroresCampo({ nombre: "El nombre es obligatorio" });
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        await actualizarCaracteristica(editando.id, formulario);
        setAviso(`Se actualizó "${formulario.nombre}".`);
      } else {
        await crearCaracteristica(formulario);
        setAviso(`Se agregó "${formulario.nombre}".`);
      }
      cancelarEdicion();
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo guardar la característica"));
      setErroresCampo(erroresPorCampo(e));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    setEliminando(true);
    setError("");
    try {
      await eliminarCaracteristica(aEliminar.id);
      setAviso(`Se eliminó "${aEliminar.nombre}".`);
      setAEliminar(null);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo eliminar la característica"));
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
    <PanelAdmin titulo="Administrar características" acciones={acciones}>
      {aviso && <p className="mensaje mensaje--exito">{aviso}</p>}
      {error && <p className="mensaje mensaje--error">{error}</p>}

      <form className="admin__formulario admin__formulario--linea" onSubmit={alEnviar} noValidate>
        <h2 className="titulo-seccion">
          {editando ? `Editar "${editando.nombre}"` : "Añadir nueva"}
        </h2>

        <div className="field admin__campo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            className="input"
            type="text"
            maxLength={80}
            placeholder="Ej: Wi-Fi"
            value={formulario.nombre}
            onChange={alCambiar}
          />
          {erroresCampo.nombre && <span className="admin__error-campo">{erroresCampo.nombre}</span>}
        </div>

        <div className="field admin__campo">
          <label htmlFor="icono">Ícono asociado</label>
          <div className="admin__icono-selector">
            <select
              id="icono"
              name="icono"
              className="input"
              value={formulario.icono}
              onChange={alCambiar}
            >
              {ICONOS_DISPONIBLES.map((icono) => (
                <option key={icono} value={icono}>
                  {icono}
                </option>
              ))}
            </select>
            <span className="admin__icono-vista" aria-hidden="true">
              <IconoCaracteristica icono={formulario.icono} tamanio={24} />
            </span>
          </div>
          {erroresCampo.icono && <span className="admin__error-campo">{erroresCampo.icono}</span>}
        </div>

        <div className="admin__acciones-formulario">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Añadir nueva"}
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
        <p className="estado-vacio">Cargando características…</p>
      ) : caracteristicas.length === 0 ? (
        <p className="estado-vacio">Todavía no hay características cargadas.</p>
      ) : (
        <div className="admin__tabla-contenedor">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Ícono</th>
                <th scope="col">Nombre</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {caracteristicas.map((caracteristica) => (
                <tr key={caracteristica.id}>
                  <td>
                    <IconoCaracteristica icono={caracteristica.icono} />
                  </td>
                  <td>{caracteristica.nombre}</td>
                  <td className="admin__acciones-fila">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => empezarEdicion(caracteristica)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setAviso("");
                        setAEliminar(caracteristica);
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
          titulo="Eliminar característica"
          mensaje={`¿Confirmás que querés eliminar «${aEliminar.nombre}»? Se va a quitar de todos los alojamientos que la tengan.`}
          textoConfirmar="Eliminar"
          procesando={eliminando}
          onConfirmar={confirmarEliminacion}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </PanelAdmin>
  );
}
