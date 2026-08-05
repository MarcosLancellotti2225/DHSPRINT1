import { useEffect, useState } from "react";

/** Ancho por debajo del cual el panel de administración no está disponible. */
export const ANCHO_MINIMO_ADMIN = 768;

/**
 * Chequeo simple de ancho de viewport (sin detección de user-agent) usado para
 * bloquear el panel de administración en dispositivos móviles.
 */
export default function usePantallaChica(anchoMinimo = ANCHO_MINIMO_ADMIN) {
  const consulta = `(max-width: ${anchoMinimo - 1}px)`;
  const [esChica, setEsChica] = useState(() => window.matchMedia(consulta).matches);

  useEffect(() => {
    const media = window.matchMedia(consulta);
    const alCambiar = (evento) => setEsChica(evento.matches);

    setEsChica(media.matches);
    media.addEventListener("change", alCambiar);
    return () => media.removeEventListener("change", alCambiar);
  }, [consulta]);

  return esChica;
}
