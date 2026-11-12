import { describe, expect, it } from "vitest";
import { formatearPrecio, nochesEntre, totalDeEstadia } from "./precio";

describe("formatearPrecio", () => {
  it("muestra el precio en pesos sin decimales", () => {
    // El espacio del formato es un no-breaking space, no uno común.
    expect(formatearPrecio(85000)).toMatch(/85\.000/);
    expect(formatearPrecio(85000)).toMatch(/\$/);
  });

  it("devuelve null cuando no hay un precio que mostrar", () => {
    expect(formatearPrecio(null)).toBeNull();
    expect(formatearPrecio(undefined)).toBeNull();
    expect(formatearPrecio("")).toBeNull();
    expect(formatearPrecio("abc")).toBeNull();
  });

  it("acepta el precio como texto, que es como llega del backend", () => {
    expect(formatearPrecio("73500.50")).toMatch(/73\.501|73\.500/);
  });
});

describe("nochesEntre", () => {
  it("cuenta las noches como rango media abierto", () => {
    // Del 10 al 12 son dos noches, no tres: la misma regla que usa el backend.
    expect(nochesEntre("2026-12-10", "2026-12-12")).toBe(2);
  });

  it("es cero sin fechas o con el rango invertido", () => {
    expect(nochesEntre(null, "2026-12-12")).toBe(0);
    expect(nochesEntre("2026-12-12", "2026-12-10")).toBe(0);
    expect(nochesEntre("2026-12-10", "2026-12-10")).toBe(0);
  });
});

describe("totalDeEstadia", () => {
  it("multiplica el precio por las noches", () => {
    expect(totalDeEstadia(50000, "2026-12-10", "2026-12-13")).toBe(150000);
  });

  it("devuelve null si falta el rango", () => {
    expect(totalDeEstadia(50000, "2026-12-10", null)).toBeNull();
  });
});
