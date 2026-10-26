import { describe, expect, it } from "vitest";
import {
  aFecha,
  aTexto,
  celdasDelMes,
  estaOcupada,
  hayConflicto,
  nochesOcupadasEntre,
  nombreDelMes,
  unMesDespues,
} from "./calendario";

const TRAMOS = [{ entrada: "2026-11-10", salida: "2026-11-15" }];

describe("Utilidades del calendario", () => {
  it("convierte texto a fecha sin desfase de zona horaria", () => {
    const fecha = aFecha("2026-11-05");
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(10);
    expect(fecha.getDate()).toBe(5);
  });

  it("convierte fecha a texto con ceros a la izquierda", () => {
    expect(aTexto(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("nombra el mes en español", () => {
    expect(nombreDelMes(new Date(2026, 10, 1))).toBe("noviembre 2026");
  });

  it("arma el mes empezando en lunes", () => {
    // El 1 de noviembre de 2026 cae domingo: quedan seis huecos antes.
    const celdas = celdasDelMes(new Date(2026, 10, 1));
    expect(celdas.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(celdas[6].getDate()).toBe(1);
    expect(celdas.filter(Boolean)).toHaveLength(30);
  });

  it("marca como ocupadas las noches del tramo", () => {
    expect(estaOcupada(aFecha("2026-11-10"), TRAMOS)).toBe(true);
    expect(estaOcupada(aFecha("2026-11-14"), TRAMOS)).toBe(true);
  });

  it("la noche de salida ya está libre", () => {
    // Ese día el huésped anterior se va, así que puede entrar otro.
    expect(estaOcupada(aFecha("2026-11-15"), TRAMOS)).toBe(false);
  });

  it("fuera del tramo no hay ocupación", () => {
    expect(estaOcupada(aFecha("2026-11-09"), TRAMOS)).toBe(false);
    expect(estaOcupada(aFecha("2026-12-01"), TRAMOS)).toBe(false);
  });

  it("detecta un rango que pisa una reserva", () => {
    expect(hayConflicto("2026-11-12", "2026-11-18", TRAMOS)).toBe(true);
    expect(hayConflicto("2026-11-08", "2026-11-11", TRAMOS)).toBe(true);
  });

  it("un rango que encadena con la salida no da conflicto", () => {
    expect(hayConflicto("2026-11-15", "2026-11-18", TRAMOS)).toBe(false);
    expect(hayConflicto("2026-11-05", "2026-11-10", TRAMOS)).toBe(false);
  });

  it("sin rango completo no hay conflicto que evaluar", () => {
    expect(hayConflicto("2026-11-12", "", TRAMOS)).toBe(false);
  });

  it("propone la salida a un mes exacto", () => {
    expect(unMesDespues("2026-10-29")).toBe("2026-11-29");
    expect(unMesDespues("2026-11-05")).toBe("2026-12-05");
  });

  it("si el día no existe en el mes siguiente, usa el último", () => {
    // El 31 de enero + 1 mes no es el 31 de febrero.
    expect(unMesDespues("2026-01-31")).toBe("2026-02-28");
  });

  it("lista las noches ocupadas que caen dentro del rango", () => {
    expect(nochesOcupadasEntre("2026-11-08", "2026-11-20", TRAMOS)).toEqual([
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
  });

  it("sin ocupación dentro del rango devuelve una lista vacía", () => {
    expect(nochesOcupadasEntre("2026-11-16", "2026-11-20", TRAMOS)).toEqual([]);
  });
});
