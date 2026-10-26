import { client } from "./client";

/** Máximo de productos por página que acepta el backend. */
export const TAMANIO_PAGINA = 10;

/**
 * Listado paginado. Con `ciudadId` se acota a un destino y con `categorias` (array
 * de ids) a esas categorías; el filtrado se resuelve en el backend, no acá.
 */
export async function listarProductos(
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  categorias = [],
  ciudadId = null
) {
  const params = { page: pagina, size: tamanio };
  if (categorias.length > 0) {
    params.categorias = categorias;
  }
  if (ciudadId) {
    params.ciudad = ciudadId;
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

export async function crearProducto({
  nombre,
  descripcion,
  ciudadId,
  categoriaId,
  caracteristicaIds,
  imagenes,
}) {
  const { data } = await client.post("/productos", formularioDeProducto({
    nombre,
    descripcion,
    ciudadId,
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
export async function editarProducto(id, {
  nombre,
  descripcion,
  ciudadId,
  categoriaId,
  caracteristicaIds,
  imagenes,
}) {
  const { data } = await client.put(`/productos/${id}`, formularioDeProducto({
    nombre,
    descripcion,
    ciudadId,
    categoriaId,
    caracteristicaIds,
    imagenes,
  }));
  return data;
}

export async function eliminarProducto(id) {
  await client.delete(`/productos/${id}`);
}

function formularioDeProducto({
  nombre,
  descripcion,
  ciudadId,
  categoriaId,
  caracteristicaIds,
  imagenes,
}) {
  const formulario = new FormData();
  formulario.append("nombre", nombre);
  formulario.append("descripcion", descripcion);

  if (ciudadId) {
    formulario.append("ciudadId", ciudadId);
  }

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
