/**
 * Resuelve el ícono de una característica a partir del identificador de texto que
 * guarda el backend ("wifi", "pileta", "cocina"…). En la base no hay SVG: el dibujo
 * vive acá, así que cambiar la ilustración no obliga a migrar datos.
 *
 * Si llega un identificador desconocido se dibuja un ícono genérico en vez de
 * dejar un hueco.
 */
const ICONOS = {
  wifi: (
    <>
      <path d="M2.5 8.5a15 15 0 0 1 19 0" />
      <path d="M5.5 12a10.5 10.5 0 0 1 13 0" />
      <path d="M8.5 15.5a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  pileta: (
    <>
      <path d="M3 15.5c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M3 19c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M8 16V5a2 2 0 0 1 4 0" />
      <path d="M14 16V5a2 2 0 0 1 4 0" />
      <path d="M8 9.5h6" />
    </>
  ),
  cocina: (
    <>
      <path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
      <path d="M3 6h18" />
      <path d="M8 6V3.5M16 6V3.5" />
    </>
  ),
  estacionamiento: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M10 16.5V7.5h3.2a2.7 2.7 0 0 1 0 5.4H10" />
    </>
  ),
  aire: (
    <>
      <path d="M12 3v18" />
      <path d="M4.2 7.5l15.6 9" />
      <path d="M19.8 7.5l-15.6 9" />
      <path d="M12 6.6 9.7 4.6M12 6.6l2.3-2M12 17.4l-2.3 2M12 17.4l2.3 2" />
    </>
  ),
  desayuno: (
    <>
      <path d="M4 8.5h12V15a4.5 4.5 0 0 1-4.5 4.5h-3A4.5 4.5 0 0 1 4 15V8.5z" />
      <path d="M16 10.5h2.2a2.5 2.5 0 0 1 0 5H16" />
      <path d="M7.5 5.5V3.5M11.5 5.5V3.5" />
    </>
  ),
  mascotas: (
    <>
      <ellipse cx="7" cy="9.5" rx="1.7" ry="2.3" />
      <ellipse cx="12" cy="7.5" rx="1.7" ry="2.3" />
      <ellipse cx="17" cy="9.5" rx="1.7" ry="2.3" />
      <path d="M12 12.5c3 0 5 2.1 5 4.2s-2 3.6-5 3.6-5-1.5-5-3.6 2-4.2 5-4.2z" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8.5 20.5h7M12 17v3.5" />
    </>
  ),
  gimnasio: (
    <>
      <path d="M4 9.5v5M7 7v10M17 7v10M20 9.5v5M7 12h10" />
    </>
  ),
  spa: (
    <>
      <path d="M12 20.5c0-4.7 2.9-8.5 7.5-8.5 0 4.7-2.9 8.5-7.5 8.5z" />
      <path d="M12 20.5c0-4.7-2.9-8.5-7.5-8.5 0 4.7 2.9 8.5 7.5 8.5z" />
      <path d="M12 20.5v-5.5" />
    </>
  ),
};

/** Íconos que sabe dibujar el frontend; alimenta el selector del panel. */
export const ICONOS_DISPONIBLES = Object.keys(ICONOS);

const GENERICO = (
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.4 12.2l2.4 2.4 4.8-5.2" />
  </>
);

export default function IconoCaracteristica({ icono, tamanio = 22, className = "" }) {
  return (
    <svg
      width={tamanio}
      height={tamanio}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {ICONOS[icono] ?? GENERICO}
    </svg>
  );
}
