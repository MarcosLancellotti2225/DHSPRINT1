/** Utilidades de fechas del calendario, sin dependencias externas. */

export const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-11-05" -> Date local. Evita el desfase de zona horaria de new Date(texto). */
export function aFecha(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Date -> "2026-11-05" */
export function aTexto(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function nombreDelMes(fecha) {
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

/**
 * Celdas de un mes, empezando en lunes. Los huecos del principio van como null
 * para que el primer día caiga en su columna.
 */
export function celdasDelMes(fecha) {
  const primero = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const ultimo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

  // getDay() devuelve 0 para domingo; acá la semana arranca el lunes.
  const huecos = (primero.getDay() + 6) % 7;
  const celdas = Array.from({ length: huecos }, () => null);

  for (let dia = 1; dia <= ultimo.getDate(); dia++) {
    celdas.push(new Date(fecha.getFullYear(), fecha.getMonth(), dia));
  }
  return celdas;
}

/**
 * ¿Esta noche está ocupada? Los tramos son semiabiertos: la noche de `salida`
 * ya está libre, porque ese día el huésped anterior se va.
 */
export function estaOcupada(fecha, tramos) {
  const dia = aTexto(fecha);
  return tramos.some((tramo) => dia >= tramo.entrada && dia < tramo.salida);
}

/** ¿Hay alguna noche ocupada entre entrada y salida? */
export function hayConflicto(entrada, salida, tramos) {
  if (!entrada || !salida) return false;
  return tramos.some((tramo) => entrada < tramo.salida && salida > tramo.entrada);
}

/**
 * Un mes exacto después de la fecha dada, que es la salida que se propone sola al
 * elegir la entrada. Si ese día no existe (el 31 de enero + 1 mes), JavaScript
 * desborda al mes siguiente; se corrige al último día del mes correcto.
 */
export function unMesDespues(texto) {
  const entrada = aFecha(texto);
  const salida = new Date(entrada.getFullYear(), entrada.getMonth() + 1, entrada.getDate());

  if (salida.getDate() !== entrada.getDate()) {
    salida.setDate(0);
  }
  return aTexto(salida);
}

/** Las noches ocupadas que caen dentro del rango, para poder señalarlas. */
export function nochesOcupadasEntre(entrada, salida, tramos) {
  if (!entrada || !salida) return [];

  const ocupadas = [];
  const limite = aFecha(salida);
  for (let dia = aFecha(entrada); dia < limite; dia.setDate(dia.getDate() + 1)) {
    if (estaOcupada(dia, tramos)) {
      ocupadas.push(aTexto(dia));
    }
  }
  return ocupadas;
}

export function esPasada(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha < hoy;
}
