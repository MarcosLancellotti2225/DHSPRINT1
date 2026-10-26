import { client } from "./client";

export async function listarValoraciones(productoId) {
  const { data } = await client.get(`/productos/${productoId}/valoraciones`);
  return data;
}

export async function valorarProducto(productoId, { estrellas, comentario }) {
  const { data } = await client.post(`/productos/${productoId}/valoraciones`, {
    estrellas,
    comentario,
  });
  return data;
}
