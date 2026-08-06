import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Paginacion from "./Paginacion";

describe("Paginacion", () => {
  it("no se muestra si hay una sola página", () => {
    const { container } = render(
      <Paginacion pagina={0} totalPaginas={1} onCambiarPagina={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra en qué página estás", () => {
    render(<Paginacion pagina={2} totalPaginas={5} onCambiarPagina={() => {}} />);
    expect(screen.getByText("Página 3 de 5")).toBeInTheDocument();
  });

  it("deshabilita ir atrás cuando estás en la primera página", () => {
    render(<Paginacion pagina={0} totalPaginas={3} onCambiarPagina={() => {}} />);

    expect(screen.getByRole("button", { name: /inicio/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /atrás/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /adelante/i })).toBeEnabled();
  });

  it("deshabilita ir adelante cuando estás en la última página", () => {
    render(<Paginacion pagina={2} totalPaginas={3} onCambiarPagina={() => {}} />);

    expect(screen.getByRole("button", { name: /adelante/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /atrás/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /inicio/i })).toBeEnabled();
  });

  it("avisa a qué página hay que ir en cada botón", async () => {
    const alCambiar = vi.fn();
    render(<Paginacion pagina={2} totalPaginas={5} onCambiarPagina={alCambiar} />);

    await userEvent.click(screen.getByRole("button", { name: /adelante/i }));
    expect(alCambiar).toHaveBeenLastCalledWith(3);

    await userEvent.click(screen.getByRole("button", { name: /atrás/i }));
    expect(alCambiar).toHaveBeenLastCalledWith(1);

    await userEvent.click(screen.getByRole("button", { name: /inicio/i }));
    expect(alCambiar).toHaveBeenLastCalledWith(0);
  });
});
