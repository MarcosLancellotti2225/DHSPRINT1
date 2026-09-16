import { client } from "./client";

export async function listarCategorias() {
  const { data } = await client.get("/categorias");
  return data;
}

export async function crearCategoria({ titulo, descripcion, imagen }) {
  const { data } = await client.post("/categorias", { titulo, descripcion, imagen });
  return data;
}

export async function actualizarCategoria(id, { titulo, descripcion, imagen }) {
  const { data } = await client.put(`/categorias/${id}`, { titulo, descripcion, imagen });
  return data;
}

export async function eliminarCategoria(id) {
  await client.delete(`/categorias/${id}`);
}
