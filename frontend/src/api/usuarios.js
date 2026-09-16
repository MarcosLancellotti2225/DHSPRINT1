import { client } from "./client";

export async function listarUsuarios() {
  const { data } = await client.get("/usuarios");
  return data;
}

export async function cambiarRolUsuario(id, administrador) {
  const { data } = await client.patch(`/usuarios/${id}/rol`, { administrador });
  return data;
}
