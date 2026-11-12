import { client } from "./client";

/** Máximo de productos por página que acepta el backend. */
export const TAMANIO_PAGINA = 10;

/**
 * Listado paginado. Con `ciudadId` se acota a un destino, con `categorias` (array de
 * ids) a esas categorías y con `fechas` (rango y huéspedes) a lo que esté libre y tenga
 * lugar suficiente; el filtrado se resuelve en el backend, no acá.
 */
export async function listarProductos(
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  categorias = [],
  ciudadId = null,
  fechas = null
) {
  return buscarProductos({
    pagina,
    tamanio,
    categorias,
    ciudadId,
    entrada: fechas?.entrada,
    salida: fechas?.salida,
    huespedes: fechas?.huespedes,
  });
}

/**
 * Búsqueda con todos los filtros: destino, fechas, huéspedes, categorías, rango de
 * precio y características. Es la que usa la página de búsqueda; el filtrado lo
 * resuelve el backend en una sola consulta, no acá.
 */
export async function buscarProductos({
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  ciudadId = null,
  categorias = [],
  entrada = null,
  salida = null,
  huespedes = null,
  precioMinimo = null,
  precioMaximo = null,
  caracteristicas = [],
} = {}) {
  const params = { page: pagina, size: tamanio };

  if (ciudadId) {
    params.ciudad = ciudadId;
  }
  if (categorias?.length > 0) {
    params.categorias = categorias;
  }
  // El backend sólo filtra por disponibilidad con el rango completo.
  if (entrada && salida) {
    params.entrada = entrada;
    params.salida = salida;
  }
  if (huespedes > 0) {
    params.huespedes = huespedes;
  }
  // 0 es un mínimo válido pero no acota nada; null y "" no son filtros.
  if (precioMinimo !== null && precioMinimo !== undefined && precioMinimo !== "") {
    params.precioMinimo = precioMinimo;
  }
  if (precioMaximo !== null && precioMaximo !== undefined && precioMaximo !== "") {
    params.precioMaximo = precioMaximo;
  }
  if (caracteristicas?.length > 0) {
    params.caracteristicas = caracteristicas;
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
  capacidad,
  precioPorNoche,
  ciudadId,
  categoriaId,
  caracteristicaIds,
  imagenes,
}) {
  const { data } = await client.post("/productos", formularioDeProducto({
    nombre,
    descripcion,
    capacidad,
    precioPorNoche,
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
  capacidad,
  precioPorNoche,
  ciudadId,
  categoriaId,
  caracteristicaIds,
  imagenes,
}) {
  const { data } = await client.put(`/productos/${id}`, formularioDeProducto({
    nombre,
    descripcion,
    capacidad,
    precioPorNoche,
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
  capacidad,
  precioPorNoche,
  ciudadId,
  categoriaId,
  caracteristicaIds,
  imagenes,
}) {
  const formulario = new FormData();
  formulario.append("nombre", nombre);
  formulario.append("descripcion", descripcion);

  if (capacidad !== undefined && capacidad !== null && capacidad !== "") {
    formulario.append("capacidad", capacidad);
  }
  if (precioPorNoche !== undefined && precioPorNoche !== null && precioPorNoche !== "") {
    formulario.append("precioPorNoche", precioPorNoche);
  }

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
