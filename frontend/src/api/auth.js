import { client } from "./client";

export async function registrarUsuario({ nombre, apellido, email, password }) {
  const { data } = await client.post("/auth/registro", { nombre, apellido, email, password });
  return data;
}

export async function iniciarSesion({ email, password }) {
  const { data } = await client.post("/auth/login", { email, password });
  return data;
}

/** Revalida contra el backend el token guardado y devuelve el usuario dueño. */
export async function obtenerPerfil() {
  const { data } = await client.get("/auth/perfil");
  return data;
}
