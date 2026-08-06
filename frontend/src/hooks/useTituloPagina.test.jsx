import { afterEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import useTituloPagina from "./useTituloPagina";

function Pagina({ titulo }) {
  useTituloPagina(titulo);
  return null;
}

describe("useTituloPagina", () => {
  afterEach(() => {
    document.title = "NextHome · Reservá tu próxima estadía";
  });

  it("le agrega la marca al título de la página", () => {
    render(<Pagina titulo="Lista de productos" />);
    expect(document.title).toBe("Lista de productos · NextHome");
  });

  it("no toca el título si todavía no hay uno (por ejemplo mientras carga)", () => {
    document.title = "Título previo";
    render(<Pagina titulo={null} />);
    expect(document.title).toBe("Título previo");
  });

  it("lo actualiza cuando cambia el título", () => {
    const { rerender } = render(<Pagina titulo="Hotel Costa Serena" />);
    expect(document.title).toBe("Hotel Costa Serena · NextHome");

    rerender(<Pagina titulo="Cabaña del Lago" />);
    expect(document.title).toBe("Cabaña del Lago · NextHome");
  });

  it("restaura el título anterior al desmontarse", () => {
    document.title = "Título previo";
    const { unmount } = render(<Pagina titulo="Agregar producto" />);
    expect(document.title).toBe("Agregar producto · NextHome");

    unmount();
    expect(document.title).toBe("Título previo");
  });
});
