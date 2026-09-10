import { useContext } from "react";
import { SesionContext } from "../context/SesionContext";

/** Acceso al usuario identificado y a las acciones de sesión. */
export default function useSesion() {
  const sesion = useContext(SesionContext);
  if (!sesion) {
    throw new Error("useSesion se tiene que usar dentro de un ProveedorSesion");
  }
  return sesion;
}
