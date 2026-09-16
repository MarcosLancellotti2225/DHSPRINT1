import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useSesion from "../hooks/useSesion";
import useTituloPagina from "../hooks/useTituloPagina";
import { mensajeDeError } from "../api/client";
import "../styles/Autenticacion.css";

const FORMULARIO_VACIO = { email: "", password: "" };

export function validarLogin({ email, password }) {
  const errores = {};
  if (!email.trim()) errores.email = "El email es obligatorio";
  if (!password) errores.password = "La contraseña es obligatoria";
  return errores;
}

export default function Login() {
  useTituloPagina("Iniciar sesión");

  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { ingresar } = useSesion();

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
    setErrores((previos) => ({ ...previos, [name]: undefined }));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setError("");

    const erroresLocales = validarLogin(formulario);
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    try {
      await ingresar({ email: formulario.email.trim(), password: formulario.password });
      // Si llegó acá desde una ruta protegida, se vuelve a esa; si no, al home.
      navegar(ubicacion.state?.desde ?? "/", { replace: true });
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo iniciar sesión"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="autenticacion">
      <div className="card elev-md autenticacion__panel">
        <h1 className="autenticacion__titulo">Iniciar sesión</h1>
        <p className="autenticacion__bajada">Entrá con tu email y tu contraseña.</p>

        {error && <p className="mensaje mensaje--error">{error}</p>}

        <form className="autenticacion__formulario" onSubmit={alEnviar} noValidate>
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
              autoComplete="current-password"
              value={formulario.password}
              onChange={alCambiar}
              aria-invalid={Boolean(errores.password)}
            />
            {errores.password && <span className="autenticacion__error">{errores.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="autenticacion__pie">
          ¿Todavía no tenés cuenta? <Link to="/crear-cuenta">Creá una</Link>
        </p>
      </div>
    </div>
  );
}
