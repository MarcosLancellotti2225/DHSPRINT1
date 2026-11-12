import { describe, expect, it } from "vitest";
import { siguienteIndice } from "./ModalGaleria";

describe("siguienteIndice", () => {
  it("avanza y retrocede de a uno", () => {
    expect(siguienteIndice(0, 5, 1)).toBe(1);
    expect(siguienteIndice(3, 5, -1)).toBe(2);
  });

  // Da la vuelta en los dos extremos: es lo que se espera de un carrusel.
  it("de la ultima vuelve a la primera", () => {
    expect(siguienteIndice(4, 5, 1)).toBe(0);
  });

  it("de la primera vuelve a la ultima", () => {
    expect(siguienteIndice(0, 5, -1)).toBe(4);
  });

  it("con una sola imagen se queda donde esta", () => {
    expect(siguienteIndice(0, 1, 1)).toBe(0);
    expect(siguienteIndice(0, 1, -1)).toBe(0);
  });

  // Sin imágenes no hay índice válido; no tiene que devolver NaN.
  it("sin imagenes devuelve cero", () => {
    expect(siguienteIndice(0, 0, 1)).toBe(0);
  });
});
