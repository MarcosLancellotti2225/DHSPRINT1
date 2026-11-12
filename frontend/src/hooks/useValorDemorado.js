import { useEffect, useRef, useState } from "react";

/**
 * Devuelve el valor recién después de que deja de cambiar por `espera` ms.
 *
 * Sirve para no disparar una búsqueda por cada click: mientras el usuario sigue
 * tildando filtros el valor queda quieto, y recién cuando para se actualiza.
 *
 * El primer valor no se demora: al entrar a la página no hay nada que esperar.
 */
export default function useValorDemorado(valor, espera = 400) {
  const [demorado, setDemorado] = useState(valor);
  const primeraVez = useRef(true);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      setDemorado(valor);
      return undefined;
    }

    const temporizador = setTimeout(() => setDemorado(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);

  return demorado;
}
