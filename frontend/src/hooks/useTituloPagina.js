import { useEffect } from "react";

const MARCA = "NextHome";

/**
 * Pone el título de la pestaña para la página actual y lo restaura al salir.
 * Pasando null (por ejemplo mientras se carga) deja el título que ya había.
 */
export default function useTituloPagina(titulo) {
  useEffect(() => {
    if (!titulo) return undefined;

    const anterior = document.title;
    document.title = `${titulo} · ${MARCA}`;

    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
