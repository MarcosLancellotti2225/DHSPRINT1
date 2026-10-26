import { useContext } from "react";
import { FavoritosContext } from "../context/FavoritosContext";

/** Favoritos del usuario identificado y las acciones para marcarlos. */
export default function useFavoritos() {
  const favoritos = useContext(FavoritosContext);
  if (!favoritos) {
    throw new Error("useFavoritos se tiene que usar dentro de un ProveedorFavoritos");
  }
  return favoritos;
}
