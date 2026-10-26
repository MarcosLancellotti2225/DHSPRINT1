import { client } from "./client";

export async function listarPoliticas() {
  const { data } = await client.get("/politicas");
  return data;
}
