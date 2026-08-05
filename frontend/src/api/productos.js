import { client } from "./client";

/** Máximo de productos por página que acepta el backend. */
export const TAMANIO_PAGINA = 10;

export async function listarProductos(pagina = 0, tamanio = TAMANIO_PAGINA) {
  const { data } = await client.get("/productos", { params: { page: pagina, size: tamanio } });
  return data;
}

export async function listarProductosAleatorios(limite = 10) {
  const { data } = await client.get("/productos/random", { params: { limit: limite } });
  return data;
}

export async function obtenerProducto(id) {
  const { data } = await client.get(`/productos/${id}`);
  return data;
}

export async function crearProducto({ nombre, descripcion, imagenes }) {
  const formulario = new FormData();
  formulario.append("nombre", nombre);
  formulario.append("descripcion", descripcion);
  for (const imagen of imagenes) {
    formulario.append("imagenes", imagen);
  }
  const { data } = await client.post("/productos", formulario);
  return data;
}

export async function eliminarProducto(id) {
  await client.delete(`/productos/${id}`);
}
