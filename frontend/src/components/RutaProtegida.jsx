import { Navigate, Outlet, useLocation } from "react-router-dom";
import useSesion from "../hooks/useSesion";

/**
 * Envuelve las rutas que exigen sesión iniciada, y opcionalmente rol de
 * administrador. Es una comodidad de navegación: la autorización de verdad la
 * hace el backend en cada endpoint.
 */
export default function RutaProtegida({ soloAdministrador = false }) {
  const { autenticado, esAdministrador, cargando } = useSesion();
  const ubicacion = useLocation();

  // Mientras se revalida el token guardado no se decide nada, para no rebotar
  // a login a alguien que en realidad tiene la sesión abierta.
  if (cargando) {
    return <p className="estado-vacio">Verificando tu sesión…</p>;
  }

  if (!autenticado) {
    return <Navigate to="/ingresar" state={{ desde: ubicacion.pathname }} replace />;
  }

  if (soloAdministrador && !esAdministrador) {
    return (
      <div className="estado-vacio">
        <h1 className="titulo-seccion">No tenés acceso a esta sección</h1>
        <p>El panel de administración es sólo para usuarios con permisos de administrador.</p>
      </div>
    );
  }

  return <Outlet />;
}
