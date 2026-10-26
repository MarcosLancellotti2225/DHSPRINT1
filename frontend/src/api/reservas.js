import { client } from "./client";

export async function obtenerDisponibilidad(productoId) {
  const { data } = await client.get(`/reservas/disponibilidad/${productoId}`);
  return data;
}

export async function crearReserva({ productoId, entrada, salida, huespedes }) {
  const { data } = await client.post("/reservas", { productoId, entrada, salida, huespedes });
  return data;
}

export async function listarMisReservas() {
  const { data } = await client.get("/reservas/mias");
  return data;
}
