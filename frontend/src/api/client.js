import axios from "axios";

/** URL base del backend. Se puede sobrescribir con VITE_API_URL en un archivo .env */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/** Clave de localStorage donde vive el token; así la sesión sobrevive a una recarga. */
const CLAVE_TOKEN = "nexthome.token";

/** Se emite cuando el backend rechaza el token guardado, para que el contexto reaccione. */
export const EVENTO_SESION_EXPIRADA = "nexthome:sesion-expirada";

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    // Modo incógnito con almacenamiento bloqueado: se navega como anónimo.
    return null;
  }
}

export function guardarToken(token) {
  try {
    localStorage.setItem(CLAVE_TOKEN, token);
  } catch {
    // Sin almacenamiento la sesión igual funciona, sólo que no sobrevive a la recarga.
  }
}

export function borrarToken() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Nada que hacer: si no se pudo escribir, tampoco hay nada guardado.
  }
}

export const client = axios.create({
  baseURL: `${API_URL}/api`,
});

/** Todo request sale firmado si hay sesión abierta. */
client.interceptors.request.use((configuracion) => {
  const token = leerToken();
  if (token) {
    configuracion.headers.Authorization = `Bearer ${token}`;
  }
  return configuracion;
});

/**
 * Si el backend responde 401 teniendo nosotros un token, ese token ya no sirve
 * (venció o la cuenta cambió): se descarta y se avisa para cerrar la sesión.
 */
client.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error?.response?.status === 401 && leerToken()) {
      borrarToken();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    return Promise.reject(error);
  }
);

/** Las imágenes llegan como rutas relativas (/uploads/x.png) y hay que anteponerles el host. */
export function urlImagen(ruta) {
  if (!ruta) return "";
  return ruta.startsWith("http") ? ruta : `${API_URL}${ruta}`;
}

/** Extrae el mensaje que mandó el backend, con un texto de respaldo si no hubo respuesta. */
export function mensajeDeError(error, respaldo = "Ocurrió un error inesperado") {
  return error?.response?.data?.mensaje ?? respaldo;
}

/** Errores por campo que devuelve el backend en las respuestas 400. */
export function erroresPorCampo(error) {
  return error?.response?.data?.errores ?? {};
}
