/** Formato de precios del sitio: pesos argentinos, sin decimales. */
const FORMATO = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** "$ 85.000". Devuelve null si no hay un precio válido para mostrar. */
export function formatearPrecio(valor) {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === "" || Number.isNaN(numero)) {
    return null;
  }
  return FORMATO.format(numero);
}

/**
 * Noches entre dos fechas ISO. Es media abierta: del 10 al 12 son dos noches,
 * la misma regla con la que el backend decide si dos reservas se pisan.
 */
export function nochesEntre(entrada, salida) {
  if (!entrada || !salida) return 0;
  const desde = new Date(`${entrada}T00:00:00`);
  const hasta = new Date(`${salida}T00:00:00`);
  const dias = Math.round((hasta - desde) / 86400000);
  return dias > 0 ? dias : 0;
}

/** Total de la estadía: precio por noche por la cantidad de noches. */
export function totalDeEstadia(precioPorNoche, entrada, salida) {
  const noches = nochesEntre(entrada, salida);
  const precio = Number(precioPorNoche);
  if (!noches || Number.isNaN(precio)) return null;
  return precio * noches;
}
