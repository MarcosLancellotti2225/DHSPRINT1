import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminCategorias from "./AdminCategorias";
import { eliminarCategoria, listarCategorias } from "../api/categorias";

vi.mock("../api/categorias", () => ({
  listarCategorias: vi.fn(),
  crearCategoria: vi.fn(),
  actualizarCategoria: vi.fn(),
  eliminarCategoria: vi.fn(),
}));

function categoria(extra = {}) {
  return {
    id: 1,
    titulo: "Hoteles",
    descripcion: "Con recepción.",
    imagen: "/uploads/h.png",
    alojamientos: 0,
    ...extra,
  };
}

function renderizar() {
  return render(
    <MemoryRouter>
      <AdminCategorias />
    </MemoryRouter>
  );
}

async function abrirEliminar(usuario) {
  await usuario.click(await screen.findByRole("button", { name: /eliminar/i }));
  return screen.getByRole("dialog");
}

describe("Eliminar categoría", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("avisa cuántos alojamientos quedarán sin categoría", async () => {
    listarCategorias.mockResolvedValue([categoria({ alojamientos: 7 })]);

    const usuario = userEvent.setup();
    renderizar();
    const modal = await abrirEliminar(usuario);

    expect(modal).toHaveTextContent(/«Hoteles»/);
    expect(modal).toHaveTextContent(/7 alojamientos la tienen asignada y quedarán sin categoría/i);
    expect(modal).toHaveTextContent(/no se eliminan/i);
    expect(modal).toHaveTextContent(/no se puede deshacer/i);
  });

  it("concuerda el singular con un solo alojamiento", async () => {
    listarCategorias.mockResolvedValue([categoria({ alojamientos: 1 })]);

    const usuario = userEvent.setup();
    renderizar();
    const modal = await abrirEliminar(usuario);

    expect(modal).toHaveTextContent(/1 alojamiento la tiene asignada y quedará sin categoría/i);
  });

  it("si no hay alojamientos asignados lo dice", async () => {
    listarCategorias.mockResolvedValue([categoria({ alojamientos: 0 })]);

    const usuario = userEvent.setup();
    renderizar();
    const modal = await abrirEliminar(usuario);

    expect(modal).toHaveTextContent(/no hay alojamientos asignados/i);
  });

  it("ofrece confirmar o cancelar, y cancelar no elimina", async () => {
    listarCategorias.mockResolvedValue([categoria({ alojamientos: 3 })]);

    const usuario = userEvent.setup();
    renderizar();
    const modal = await abrirEliminar(usuario);

    expect(modal).toHaveTextContent(/cancelar/i);
    await usuario.click(screen.getByRole("button", { name: /^cancelar$/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(eliminarCategoria).not.toHaveBeenCalled();
  });

  it("al confirmar la elimina", async () => {
    listarCategorias
      .mockResolvedValueOnce([categoria({ alojamientos: 3 })])
      .mockResolvedValueOnce([]);
    eliminarCategoria.mockResolvedValue(undefined);

    const usuario = userEvent.setup();
    renderizar();
    const modal = await abrirEliminar(usuario);
    await usuario.click(within(modal).getByRole("button", { name: /^eliminar$/i }));

    expect(await screen.findByText(/se eliminó la categoría "Hoteles"/i)).toBeInTheDocument();
    expect(eliminarCategoria).toHaveBeenCalledWith(1);
  });
});
