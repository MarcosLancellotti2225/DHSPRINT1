import { client } from "./client";

export async function listarCaracteristicas() {
  const { data } = await client.get("/caracteristicas");
  return data;
}

export async function crearCaracteristica({ nombre, icono }) {
  const { data } = await client.post("/caracteristicas", { nombre, icono });
  return data;
}

export async function actualizarCaracteristica(id, { nombre, icono }) {
  const { data } = await client.put(`/caracteristicas/${id}`, { nombre, icono });
  return data;
}

export async function eliminarCaracteristica(id) {
  await client.delete(`/caracteristicas/${id}`);
}
