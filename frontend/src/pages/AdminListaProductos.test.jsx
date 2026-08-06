import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminListaProductos from "./AdminListaProductos";
import { eliminarProducto, listarProductos } from "../api/productos";

vi.mock("../api/productos", async () => {
  const real = await vi.importActual("../api/productos");
  return { ...real, listarProductos: vi.fn(), eliminarProducto: vi.fn() };
});

function paginaCon(productos) {
  return {
    contenido: productos,
    pagina: 0,
    tamanio: 10,
    totalElementos: productos.length,
    totalPaginas: 1,
    primera: true,
    ultima: true,
  };
}

const HOTEL = { id: 7, nombre: "Hotel del Valle", descripcion: "...", imagenes: [] };
const CABANA = { id: 8, nombre: "Cabaña del Lago", descripcion: "...", imagenes: [] };

function renderizarListado() {
  return render(
    <MemoryRouter>
      <AdminListaProductos />
    </MemoryRouter>
  );
}

describe("Listado de productos del panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra la tabla con las columnas Id, Nombre y Acciones", async () => {
    listarProductos.mockResolvedValue(paginaCon([HOTEL]));
    renderizarListado();

    expect(await screen.findByRole("columnheader", { name: "Id" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "7" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Hotel del Valle" })).toBeInTheDocument();
  });

  it("pide confirmación antes de eliminar", async () => {
    listarProductos.mockResolvedValue(paginaCon([HOTEL]));
    const usuario = userEvent.setup();
    renderizarListado();

    await usuario.click(await screen.findByRole("button", { name: /eliminar producto/i }));

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveTextContent(/¿Confirmás que querés eliminar «Hotel del Valle»\?/);
    expect(eliminarProducto).not.toHaveBeenCalled();
  });

  it("si cancelás, no elimina nada", async () => {
    listarProductos.mockResolvedValue(paginaCon([HOTEL]));
    const usuario = userEvent.setup();
    renderizarListado();

    await usuario.click(await screen.findByRole("button", { name: /eliminar producto/i }));
    await usuario.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(eliminarProducto).not.toHaveBeenCalled();
    expect(screen.getByRole("cell", { name: "Hotel del Valle" })).toBeInTheDocument();
  });

  it("si confirmás, lo elimina y deja de aparecer en la tabla", async () => {
    listarProductos
      .mockResolvedValueOnce(paginaCon([HOTEL, CABANA]))
      .mockResolvedValueOnce(paginaCon([CABANA]));
    eliminarProducto.mockResolvedValue(undefined);

    const usuario = userEvent.setup();
    renderizarListado();

    const botones = await screen.findAllByRole("button", { name: /eliminar producto/i });
    await usuario.click(botones[0]);
    // El segundo "Eliminar producto" es el del modal de confirmación.
    await usuario.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^eliminar$/i }));

    await waitFor(() => expect(eliminarProducto).toHaveBeenCalledWith(7));
    await waitFor(() =>
      expect(screen.queryByRole("cell", { name: "Hotel del Valle" })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("cell", { name: "Cabaña del Lago" })).toBeInTheDocument();
    expect(screen.getByText(/se eliminó "Hotel del Valle"/i)).toBeInTheDocument();
  });

  it("avisa si el borrado falla", async () => {
    listarProductos.mockResolvedValue(paginaCon([HOTEL]));
    eliminarProducto.mockRejectedValue({
      response: { status: 404, data: { estado: 404, mensaje: "No existe un producto con id 7" } },
    });

    const usuario = userEvent.setup();
    renderizarListado();

    await usuario.click(await screen.findByRole("button", { name: /eliminar producto/i }));
    await usuario.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^eliminar$/i }));

    expect(await screen.findByText("No existe un producto con id 7")).toBeInTheDocument();
  });
});
