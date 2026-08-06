import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import { crearProducto } from "../api/productos";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

const FORMULARIO_VACIO = { nombre: "", descripcion: "" };

export default function AdminNuevoProducto() {
  useTituloPagina("Agregar producto");

  const navegar = useNavigate();

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [imagenes, setImagenes] = useState([]);
  const [error, setError] = useState("");
  const [erroresCampo, setErroresCampo] = useState({});
  const [guardando, setGuardando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
  }

  function alElegirImagenes(evento) {
    setImagenes(Array.from(evento.target.files ?? []));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setError("");
    setErroresCampo({});

    if (imagenes.length === 0) {
      setError("Se debe cargar al menos una imagen del alojamiento.");
      return;
    }

    setGuardando(true);
    try {
      await crearProducto({ ...formulario, imagenes });
      navegar("/administracion/productos");
    } catch (e) {
      // El backend responde 409 si el nombre ya está en uso y 400 con el detalle por campo.
      setError(mensajeDeError(e, "No se pudo guardar el producto"));
      setErroresCampo(e?.response?.data?.errores ?? {});
    } finally {
      setGuardando(false);
    }
  }

  const acciones = (
    <Link to="/administracion" className="btn btn-secondary">
      ← Volver al panel
    </Link>
  );

  return (
    <PanelAdmin titulo="Agregar producto" acciones={acciones}>
      {error && <p className="mensaje mensaje--error">{error}</p>}

      <form className="admin__formulario" onSubmit={alEnviar} noValidate>
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
            Se pueden seleccionar varias a la vez. Para la galería del detalle se recomiendan al
            menos cinco.
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
            {guardando ? "Guardando…" : "Guardar producto"}
          </button>
        </div>
      </form>
    </PanelAdmin>
  );
}
