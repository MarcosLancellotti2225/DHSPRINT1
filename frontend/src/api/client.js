import axios from "axios";

/** URL base del backend. Se puede sobrescribir con VITE_API_URL en un archivo .env */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const client = axios.create({
  baseURL: `${API_URL}/api`,
});

/** Las imágenes llegan como rutas relativas (/uploads/x.png) y hay que anteponerles el host. */
export function urlImagen(ruta) {
  if (!ruta) return "";
  return ruta.startsWith("http") ? ruta : `${API_URL}${ruta}`;
}

/** Extrae el mensaje que mandó el backend, con un texto de respaldo si no hubo respuesta. */
export function mensajeDeError(error, respaldo = "Ocurrió un error inesperado") {
  return error?.response?.data?.mensaje ?? respaldo;
}
