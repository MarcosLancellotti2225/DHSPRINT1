import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { listarProductos, listarProductosAleatorios } from "../api/productos";

vi.mock("../api/productos", async () => {
  const real = await vi.importActual("../api/productos");
  return {
    ...real,
    listarProductos: vi.fn(),
    listarProductosAleatorios: vi.fn(),
  };
});

function producto(id) {
  return {
    id,
    nombre: `Alojamiento ${id}`,
    descripcion: `Descripción del alojamiento ${id}`,
    imagenes: [{ id, url: `/uploads/foto-${id}.png` }],
  };
}

function renderizarHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra las recomendaciones que devuelve la API", async () => {
    listarProductosAleatorios.mockResolvedValue([producto(1), producto(2)]);
    listarProductos.mockResolvedValue({
      contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0,
      primera: true, ultima: true,
    });

    renderizarHome();

    expect(await screen.findByText("Alojamiento 1")).toBeInTheDocument();
    expect(screen.getByText("Alojamiento 2")).toBeInTheDocument();
  });

  it("pide como máximo 10 recomendaciones", async () => {
    listarProductosAleatorios.mockResolvedValue([]);
    listarProductos.mockResolvedValue({
      contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0,
      primera: true, ultima: true,
    });

    renderizarHome();

    await waitFor(() => expect(listarProductosAleatorios).toHaveBeenCalledWith(10));
  });

  it("muestra el paginador cuando hay más de una página", async () => {
    listarProductosAleatorios.mockResolvedValue([]);
    listarProductos.mockResolvedValue({
      contenido: [producto(1)], pagina: 0, tamanio: 10, totalElementos: 12, totalPaginas: 2,
      primera: true, ultima: false,
    });

    renderizarHome();

    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
  });

  it("avisa si la API falla en vez de quedarse cargando", async () => {
    listarProductosAleatorios.mockRejectedValue(new Error("sin conexión"));
    listarProductos.mockRejectedValue(new Error("sin conexión"));

    renderizarHome();

    expect(await screen.findByText(/no se pudo cargar/i)).toBeInTheDocument();
  });

  it("avisa cuando todavía no hay alojamientos cargados", async () => {
    listarProductosAleatorios.mockResolvedValue([]);
    listarProductos.mockResolvedValue({
      contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0,
      primera: true, ultima: true,
    });

    renderizarHome();

    await waitFor(() =>
      expect(screen.getAllByText(/todavía no hay alojamientos/i).length).toBeGreaterThan(0)
    );
  });
});
