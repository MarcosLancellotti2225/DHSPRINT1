import { client } from "./client";

export async function listarFavoritos() {
  const { data } = await client.get("/favoritos");
  return data;
}

export async function marcarFavorito(productoId) {
  const { data } = await client.put(`/favoritos/${productoId}`);
  return data;
}

export async function desmarcarFavorito(productoId) {
  const { data } = await client.delete(`/favoritos/${productoId}`);
  return data;
}
