import { client } from "./client";

export async function listarCiudades() {
  const { data } = await client.get("/ciudades");
  return data;
}
