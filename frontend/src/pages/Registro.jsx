import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSesion from "../hooks/useSesion";
import useTituloPagina from "../hooks/useTituloPagina";
import { erroresPorCampo, mensajeDeError } from "../api/client";
import "../styles/Autenticacion.css";

const FORMULARIO_VACIO = { nombre: "", apellido: "", email: "", password: "" };

/** Mínimo de caracteres de la contraseña; el backend valida exactamente lo mismo. */
export const MINIMO_PASSWORD = 8;

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mismas reglas que aplica el backend, para avisar antes de mandar el formulario. */
export function validarRegistro({ nombre, apellido, email, password }) {
  const errores = {};

  if (!nombre.trim()) errores.nombre = "El nombre es obligatorio";
  if (!apellido.trim()) errores.apellido = "El apellido es obligatorio";

  if (!email.trim()) {
    errores.email = "El email es obligatorio";
  } else if (!FORMATO_EMAIL.test(email.trim())) {
    errores.email = "El email no tiene un formato válido";
  }

  if (!password) {
    errores.password = "La contraseña es obligatoria";
  } else if (password.length < MINIMO_PASSWORD) {
    errores.password = `La contraseña debe tener al menos ${MINIMO_PASSWORD} caracteres`;
  }

  return errores;
}

export default function Registro() {
  useTituloPagina("Crear cuenta");

  const navegar = useNavigate();
  const { registrar } = useSesion();

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
    // El error del campo se limpia apenas se lo corrige, sin tocar lo ya cargado.
    setErrores((previos) => ({ ...previos, [name]: undefined }));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setError("");

    const erroresLocales = validarRegistro(formulario);
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    try {
      await registrar({
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        email: formulario.email.trim(),
        password: formulario.password,
      });
      navegar("/");
    } catch (e) {
      const mensaje = mensajeDeError(e, "No se pudo crear la cuenta");
      setError(mensaje);
      // El 409 del email repetido se muestra además debajo del campo.
      const delBackend = erroresPorCampo(e);
      setErrores(e?.response?.status === 409 ? { ...delBackend, email: mensaje } : delBackend);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="autenticacion">
      <div className="card elev-md autenticacion__panel">
        <h1 className="autenticacion__titulo">Crear cuenta</h1>
        <p className="autenticacion__bajada">
          Registrate para guardar tus alojamientos favoritos y reservar más rápido.
        </p>

        {error && <p className="mensaje mensaje--error">{error}</p>}

        <form className="autenticacion__formulario" onSubmit={alEnviar} noValidate>
          <div className="autenticacion__fila">
            <div className="field autenticacion__campo">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                className="input"
                type="text"
                autoComplete="given-name"
                value={formulario.nombre}
                onChange={alCambiar}
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre && <span className="autenticacion__error">{errores.nombre}</span>}
            </div>

            <div className="field autenticacion__campo">
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                className="input"
                type="text"
                autoComplete="family-name"
                value={formulario.apellido}
                onChange={alCambiar}
                aria-invalid={Boolean(errores.apellido)}
              />
              {errores.apellido && <span className="autenticacion__error">{errores.apellido}</span>}
            </div>
          </div>

          <div className="field autenticacion__campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="input"
              type="email"
              autoComplete="email"
              value={formulario.email}
              onChange={alCambiar}
              aria-invalid={Boolean(errores.email)}
            />
            {errores.email && <span className="autenticacion__error">{errores.email}</span>}
          </div>

          <div className="field autenticacion__campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={formulario.password}
              onChange={alCambiar}
              aria-invalid={Boolean(errores.password)}
            />
            {errores.password ? (
              <span className="autenticacion__error">{errores.password}</span>
            ) : (
              <span className="autenticacion__ayuda">Al menos {MINIMO_PASSWORD} caracteres.</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="autenticacion__pie">
          ¿Ya tenés cuenta? <Link to="/ingresar">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
