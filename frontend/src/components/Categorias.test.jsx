import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Categorias from "./Categorias";

const CATEGORIAS = [
  { id: 1, titulo: "Hoteles", descripcion: "Con recepción.", imagen: "/uploads/h.png" },
  { id: 2, titulo: "Cabañas", descripcion: "En el bosque.", imagen: "/uploads/c.png" },
];

function renderizarFiltro(props = {}) {
  const propiedades = {
    categorias: CATEGORIAS,
    seleccionadas: [],
    onAlternar: vi.fn(),
    onLimpiar: vi.fn(),
    cantidadFiltrada: 12,
    totalProductos: 12,
    ...props,
  };
  render(<Categorias {...propiedades} />);
  return propiedades;
}

describe("Filtro por categorías", () => {
  it("lista las categorías disponibles", () => {
    renderizarFiltro();

    expect(screen.getByRole("button", { name: /hoteles/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cabañas/i })).toBeInTheDocument();
  });

  it("avisa al seleccionar una categoría", async () => {
    const usuario = userEvent.setup();
    const { onAlternar } = renderizarFiltro();

    await usuario.click(screen.getByRole("button", { name: /hoteles/i }));

    expect(onAlternar).toHaveBeenCalledWith(1);
  });

  it("permite tener varias categorías seleccionadas a la vez", () => {
    renderizarFiltro({ seleccionadas: [1, 2] });

    expect(screen.getByRole("button", { name: /hoteles/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /cabañas/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("muestra cuántos productos cumplen el filtro sobre el total", () => {
    renderizarFiltro({ seleccionadas: [1], cantidadFiltrada: 4, totalProductos: 12 });

    expect(screen.getByText("Mostrando 4 de 12 alojamientos")).toBeInTheDocument();
  });

  it("sin filtro muestra el total del catálogo", () => {
    renderizarFiltro();

    expect(screen.getByText("12 alojamientos en el catálogo")).toBeInTheDocument();
  });

  it("ofrece limpiar los filtros sólo cuando hay alguno aplicado", async () => {
    const usuario = userEvent.setup();
    const { onLimpiar } = renderizarFiltro({ seleccionadas: [1] });

    await usuario.click(screen.getByRole("button", { name: /limpiar filtros/i }));

    expect(onLimpiar).toHaveBeenCalled();
  });

  it("sin filtro no ofrece limpiarlos", () => {
    renderizarFiltro();

    expect(screen.queryByRole("button", { name: /limpiar filtros/i })).not.toBeInTheDocument();
  });
});
