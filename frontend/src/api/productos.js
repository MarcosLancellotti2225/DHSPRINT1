import { client } from "./client";

/** Máximo de productos por página que acepta el backend. */
export const TAMANIO_PAGINA = 10;

/**
 * Listado paginado. Con `categorias` (array de ids) el backend acota el resultado;
 * el filtrado se resuelve allá, no en memoria acá.
 */
export async function listarProductos(pagina = 0, tamanio = TAMANIO_PAGINA, categorias = []) {
  const params = { page: pagina, size: tamanio };
  if (categorias.length > 0) {
    params.categorias = categorias;
  }
  const { data } = await client.get("/productos", {
    params,
    // Repite el parámetro (?categorias=1&categorias=2), que es como lo espera Spring.
    paramsSerializer: { indexes: null },
  });
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

export async function crearProducto({ nombre, descripcion, categoriaId, caracteristicaIds, imagenes }) {
  const { data } = await client.post("/productos", formularioDeProducto({
    nombre,
    descripcion,
    categoriaId,
    caracteristicaIds,
    imagenes,
  }));
  return data;
}

/**
 * Edición. Las imágenes son opcionales: si no se manda ninguna se conservan las
 * que ya tenía el producto.
 */
export async function editarProducto(id, { nombre, descripcion, categoriaId, caracteristicaIds, imagenes }) {
  const { data } = await client.put(`/productos/${id}`, formularioDeProducto({
    nombre,
    descripcion,
    categoriaId,
    caracteristicaIds,
    imagenes,
  }));
  return data;
}

export async function eliminarProducto(id) {
  await client.delete(`/productos/${id}`);
}

function formularioDeProducto({ nombre, descripcion, categoriaId, caracteristicaIds, imagenes }) {
  const formulario = new FormData();
  formulario.append("nombre", nombre);
  formulario.append("descripcion", descripcion);

  // Sin categoría no se manda el campo: el backend lo interpreta como "ninguna".
  if (categoriaId) {
    formulario.append("categoriaId", categoriaId);
  }
  for (const id of caracteristicaIds ?? []) {
    formulario.append("caracteristicaIds", id);
  }
  for (const imagen of imagenes ?? []) {
    formulario.append("imagenes", imagen);
  }
  return formulario;
}
