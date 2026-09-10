import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { borrarToken, EVENTO_SESION_EXPIRADA, guardarToken, leerToken } from "../api/client";
import { iniciarSesion, obtenerPerfil, registrarUsuario } from "../api/auth";

export const SesionContext = createContext(null);

/**
 * Estado de sesión de toda la aplicación.
 *
 * El token vive en localStorage y en cada arranque se revalida contra el backend:
 * así la sesión sobrevive a una recarga, pero un token vencido no deja al frontend
 * mostrando un usuario que en realidad ya no está identificado.
 */
export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(leerToken()));

  useEffect(() => {
    if (!leerToken()) {
      setCargando(false);
      return undefined;
    }

    let vigente = true;
    obtenerPerfil()
      .then((datos) => vigente && setUsuario(datos))
      .catch(() => borrarToken())
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  // El interceptor de axios avisa cuando el backend rechaza el token guardado.
  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const registrar = useCallback(async (datos) => {
    const respuesta = await registrarUsuario(datos);
    guardarToken(respuesta.token);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }, []);

  const ingresar = useCallback(async (datos) => {
    const respuesta = await iniciarSesion(datos);
    guardarToken(respuesta.token);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }, []);

  const salir = useCallback(() => {
    borrarToken();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      autenticado: Boolean(usuario),
      esAdministrador: usuario?.rol === "ADMIN",
      registrar,
      ingresar,
      salir,
    }),
    [usuario, cargando, registrar, ingresar, salir]
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
