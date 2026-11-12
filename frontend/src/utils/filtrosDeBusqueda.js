/**
 * Traducción entre los filtros de la búsqueda y los parámetros de la URL.
 *
 * Los filtros viven en la URL y no en el estado del componente: así la búsqueda se
 * puede compartir por link, el botón "atrás" del navegador deshace un filtro y
 * recargar la página no pierde lo que el usuario había elegido.
 */

/** Filtros sin nada elegido. */
export const FILTROS_VACIOS = {
  ciudadId: null,
  entrada: "",
  salida: "",
  huespedes: 0,
  categorias: [],
  precioMinimo: "",
  precioMaximo: "",
  caracteristicas: [],
};

const SOLO_DIGITOS = /^\d+$/;

/** Enteros positivos de la URL. Cualquier cosa rara se descarta en vez de romper. */
function aEntero(valor) {
  if (valor === null || valor === undefined || !SOLO_DIGITOS.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}

/** Fechas ISO (aaaa-mm-dd) y nada más: el backend no acepta otro formato. */
function aFecha(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor ?? "") ? valor : "";
}

/** Lista de ids repetidos en la URL (?categorias=1&categorias=2), sin duplicados. */
function aListaDeIds(parametros, clave) {
  const ids = parametros
    .getAll(clave)
    .flatMap((valor) => String(valor).split(","))
    .map(aEntero)
    .filter((id) => id !== null && id > 0);
  return [...new Set(ids)];
}

/**
 * Lee los filtros de un URLSearchParams. Todo es opcional y lo inválido se ignora:
 * una URL escrita a mano no tiene que dejar la página en blanco.
 */
export function leerFiltros(parametros) {
  const desde = aFecha(parametros.get("entrada"));
  const hasta = aFecha(parametros.get("salida"));
  // Sólo es un rango si están las dos fechas y el check-out es posterior. Media
  // fecha no alcanza para filtrar disponibilidad, así que se descarta entera.
  const hayRango = Boolean(desde && hasta && hasta > desde);
  const huespedes = aEntero(parametros.get("huespedes"));

  return {
    ciudadId: aEntero(parametros.get("ciudad")),
    entrada: hayRango ? desde : "",
    salida: hayRango ? hasta : "",
    huespedes: huespedes && huespedes > 0 ? huespedes : 0,
    categorias: aListaDeIds(parametros, "categorias"),
    precioMinimo: aPrecio(parametros.get("precioMinimo")),
    precioMaximo: aPrecio(parametros.get("precioMaximo")),
    caracteristicas: aListaDeIds(parametros, "caracteristicas"),
  };
}

/** Precios: enteros no negativos, como texto para poder ponerlos en un input. */
function aPrecio(valor) {
  const numero = aEntero(valor);
  return numero === null ? "" : String(numero);
}

/**
 * Escribe los filtros como parámetros de URL. Sólo aparece lo que está elegido,
 * así la URL de una búsqueda simple queda corta y legible.
 */
export function escribirFiltros(filtros, pagina = 0) {
  const parametros = new URLSearchParams();

  if (filtros.ciudadId) parametros.set("ciudad", String(filtros.ciudadId));
  if (filtros.entrada && filtros.salida) {
    parametros.set("entrada", filtros.entrada);
    parametros.set("salida", filtros.salida);
  }
  if (filtros.huespedes > 0) parametros.set("huespedes", String(filtros.huespedes));
  for (const id of filtros.categorias ?? []) parametros.append("categorias", String(id));
  if (filtros.precioMinimo !== "" && filtros.precioMinimo !== null) {
    parametros.set("precioMinimo", String(filtros.precioMinimo));
  }
  if (filtros.precioMaximo !== "" && filtros.precioMaximo !== null) {
    parametros.set("precioMaximo", String(filtros.precioMaximo));
  }
  for (const id of filtros.caracteristicas ?? []) {
    parametros.append("caracteristicas", String(id));
  }
  // La página 1 no se escribe: es la que se ve al entrar.
  if (pagina > 0) parametros.set("pagina", String(pagina + 1));

  return parametros;
}

/** La página que se está viendo, en base 0. En la URL va en base 1, para leerla. */
export function leerPagina(parametros) {
  const numero = aEntero(parametros.get("pagina"));
  return numero && numero > 1 ? numero - 1 : 0;
}

/** True si no hay ningún filtro activo: la búsqueda es el catálogo completo. */
export function sinFiltros(filtros) {
  return (
    !filtros.ciudadId &&
    !filtros.entrada &&
    !filtros.salida &&
    !(filtros.huespedes > 0) &&
    (filtros.categorias?.length ?? 0) === 0 &&
    filtros.precioMinimo === "" &&
    filtros.precioMaximo === "" &&
    (filtros.caracteristicas?.length ?? 0) === 0
  );
}

/**
 * Cuántos filtros hay puestos. El rango de precio y el de fechas cuentan como uno
 * cada uno: son un solo criterio con dos extremos.
 */
export function cantidadDeFiltros(filtros) {
  let total = 0;
  if (filtros.ciudadId) total += 1;
  if (filtros.entrada && filtros.salida) total += 1;
  if (filtros.huespedes > 0) total += 1;
  total += filtros.categorias?.length ?? 0;
  if (filtros.precioMinimo !== "" || filtros.precioMaximo !== "") total += 1;
  total += filtros.caracteristicas?.length ?? 0;
  return total;
}
