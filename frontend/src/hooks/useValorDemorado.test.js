import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useValorDemorado from "./useValorDemorado";

describe("useValorDemorado", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // Al entrar a la página no hay nada que esperar: la primera búsqueda sale ya.
  it("no demora el primer valor", () => {
    const { result } = renderHook(() => useValorDemorado("a", 400));

    expect(result.current).toBe("a");
  });

  it("no actualiza hasta que pasa la espera", () => {
    const { result, rerender } = renderHook(({ valor }) => useValorDemorado(valor, 400), {
      initialProps: { valor: "a" },
    });

    rerender({ valor: "b" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("b");
  });

  // Lo que importa: tildar tres filtros seguidos tiene que dar una sola búsqueda.
  it("varios cambios seguidos dejan solo el ultimo", () => {
    const { result, rerender } = renderHook(({ valor }) => useValorDemorado(valor, 400), {
      initialProps: { valor: "a" },
    });

    rerender({ valor: "b" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ valor: "c" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ valor: "d" });

    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("d");
  });

  it("volver al valor original tambien espera", () => {
    const { result, rerender } = renderHook(({ valor }) => useValorDemorado(valor, 400), {
      initialProps: { valor: "a" },
    });

    rerender({ valor: "b" });
    rerender({ valor: "a" });
    act(() => vi.advanceTimersByTime(400));

    expect(result.current).toBe("a");
  });
});
