import { describe, expect, it } from "vitest";
import {
  cantidadDeFiltros,
  escribirFiltros,
  FILTROS_VACIOS,
  leerFiltros,
  leerPagina,
  sinFiltros,
} from "./filtrosDeBusqueda";

function leer(query) {
  return leerFiltros(new URLSearchParams(query));
}

describe("leerFiltros", () => {
  it("sin parametros no devuelve ningun filtro", () => {
    expect(sinFiltros(leer(""))).toBe(true);
  });

  it("lee el destino, el rango y los huespedes", () => {
    const filtros = leer("ciudad=3&entrada=2030-01-10&salida=2030-01-12&huespedes=4");

    expect(filtros.ciudadId).toBe(3);
    expect(filtros.entrada).toBe("2030-01-10");
    expect(filtros.salida).toBe("2030-01-12");
    expect(filtros.huespedes).toBe(4);
  });

  it("descarta el rango si falta una fecha", () => {
    const filtros = leer("entrada=2030-01-10");

    expect(filtros.entrada).toBe("");
    expect(filtros.salida).toBe("");
  });

  it("descarta el rango si el check-out no es posterior", () => {
    const filtros = leer("entrada=2030-01-10&salida=2030-01-10");

    expect(filtros.entrada).toBe("");
    expect(filtros.salida).toBe("");
  });

  it("ignora fechas que no son ISO", () => {
    expect(leer("entrada=10/01/2030&salida=12/01/2030").entrada).toBe("");
  });

  it("lee las listas de ids repetidas", () => {
    const filtros = leer("categorias=1&categorias=5&caracteristicas=2");

    expect(filtros.categorias).toEqual([1, 5]);
    expect(filtros.caracteristicas).toEqual([2]);
  });

  it("no repite un id que viene dos veces", () => {
    expect(leer("categorias=4&categorias=4").categorias).toEqual([4]);
  });

  it("ignora los ids que no son numeros", () => {
    expect(leer("categorias=hola&categorias=7").categorias).toEqual([7]);
  });

  it("lee el rango de precio como texto", () => {
    const filtros = leer("precioMinimo=50000&precioMaximo=90000");

    expect(filtros.precioMinimo).toBe("50000");
    expect(filtros.precioMaximo).toBe("90000");
  });

  // Una URL escrita a mano no tiene que dejar la pagina en blanco.
  it("ignora un precio invalido en vez de romper", () => {
    expect(leer("precioMinimo=mucho").precioMinimo).toBe("");
  });

  it("ignora huespedes negativos o en cero", () => {
    expect(leer("huespedes=0").huespedes).toBe(0);
    expect(leer("huespedes=-3").huespedes).toBe(0);
  });
});

describe("escribirFiltros", () => {
  it("no escribe los filtros vacios", () => {
    expect(escribirFiltros(FILTROS_VACIOS).toString()).toBe("");
  });

  it("escribe solo lo que esta elegido", () => {
    const query = escribirFiltros({ ...FILTROS_VACIOS, ciudadId: 3, huespedes: 2 }).toString();

    expect(query).toContain("ciudad=3");
    expect(query).toContain("huespedes=2");
    expect(query).not.toContain("precio");
  });

  it("no escribe media fecha", () => {
    const query = escribirFiltros({ ...FILTROS_VACIOS, entrada: "2030-01-10" }).toString();

    expect(query).not.toContain("entrada");
  });

  it("repite el parametro de cada id de la lista", () => {
    const query = escribirFiltros({ ...FILTROS_VACIOS, categorias: [1, 2] }).toString();

    expect(query).toBe("categorias=1&categorias=2");
  });

  it("no escribe la primera pagina", () => {
    expect(escribirFiltros(FILTROS_VACIOS, 0).toString()).toBe("");
  });

  it("escribe la pagina en base 1, como se lee", () => {
    expect(escribirFiltros(FILTROS_VACIOS, 2).get("pagina")).toBe("3");
  });

  // Ida y vuelta: lo que se escribe tiene que volver a leerse igual, o el boton
  // "atras" del navegador dejaria la pagina en un estado distinto al de la URL.
  it("conserva los filtros al escribir y volver a leer", () => {
    const originales = {
      ciudadId: 3,
      entrada: "2030-01-10",
      salida: "2030-01-12",
      huespedes: 4,
      categorias: [1, 5],
      precioMinimo: "50000",
      precioMaximo: "90000",
      caracteristicas: [2, 8],
    };

    expect(leerFiltros(escribirFiltros(originales, 0))).toEqual(originales);
  });
});

describe("leerPagina", () => {
  it("sin parametro es la primera", () => {
    expect(leerPagina(new URLSearchParams(""))).toBe(0);
  });

  it("pasa de base 1 a base 0", () => {
    expect(leerPagina(new URLSearchParams("pagina=3"))).toBe(2);
  });

  it("una pagina invalida cae en la primera", () => {
    expect(leerPagina(new URLSearchParams("pagina=0"))).toBe(0);
    expect(leerPagina(new URLSearchParams("pagina=ultima"))).toBe(0);
  });
});

describe("cantidadDeFiltros", () => {
  it("no cuenta nada sin filtros", () => {
    expect(cantidadDeFiltros(FILTROS_VACIOS)).toBe(0);
  });

  // El rango es un solo criterio con dos extremos, no dos filtros.
  it("cuenta el rango de fechas como uno", () => {
    const filtros = { ...FILTROS_VACIOS, entrada: "2030-01-10", salida: "2030-01-12" };

    expect(cantidadDeFiltros(filtros)).toBe(1);
  });

  it("cuenta el rango de precio como uno", () => {
    const filtros = { ...FILTROS_VACIOS, precioMinimo: "1000", precioMaximo: "2000" };

    expect(cantidadDeFiltros(filtros)).toBe(1);
  });

  it("cuenta una por cada categoria y caracteristica", () => {
    const filtros = { ...FILTROS_VACIOS, categorias: [1, 2], caracteristicas: [3] };

    expect(cantidadDeFiltros(filtros)).toBe(3);
  });
});
