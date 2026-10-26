import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { listarProductos, listarProductosAleatorios } from "../api/productos";
import { listarCategorias } from "../api/categorias";
import { listarCiudades } from "../api/ciudades";

vi.mock("../api/productos", async () => {
  const real = await vi.importActual("../api/productos");
  return { ...real, listarProductos: vi.fn(), listarProductosAleatorios: vi.fn() };
});
vi.mock("../api/categorias", () => ({ listarCategorias: vi.fn() }));
vi.mock("../api/ciudades", () => ({ listarCiudades: vi.fn() }));

// El corazón de favoritos necesita sesión y contexto; acá se prueba el home.
vi.mock("../components/BotonFavorito", () => ({ default: () => null }));

const BARILOCHE = { id: 1, nombre: "Bariloche", pais: "Argentina" };
const CABANIAS = { id: 7, titulo: "Cabañas", descripcion: "En el bosque.", imagen: "/uploads/c.png" };

function producto(id) {
  return {
    id,
    nombre: `Alojamiento ${id}`,
    descripcion: `Descripción del alojamiento ${id}`,
    ciudad: BARILOCHE,
    categoria: CABANIAS,
    caracteristicas: [],
    imagenes: [{ id, url: `/uploads/foto-${id}.png` }],
  };
}

function pagina(productos, extra = {}) {
  return {
    contenido: productos,
    pagina: 0,
    tamanio: 10,
    totalElementos: productos.length,
    totalSinFiltro: productos.length,
    totalPaginas: 1,
    primera: true,
    ultima: true,
    ...extra,
  };
}

function renderizarHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

async function buscarBariloche(usuario) {
  const destino = await screen.findByLabelText(/destino/i);
  await usuario.type(destino, "bari");
  await usuario.click(await screen.findByRole("option", { name: /bariloche/i }));
  await usuario.click(screen.getByRole("button", { name: /realizar búsqueda/i }));
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCiudades.mockResolvedValue([BARILOCHE]);
    listarCategorias.mockResolvedValue([CABANIAS]);
    listarProductosAleatorios.mockResolvedValue([]);
    listarProductos.mockResolvedValue(pagina([]));
  });

  // --- Página de inicio ---------------------------------------------------

  it("muestra las recomendaciones que devuelve la API", async () => {
    listarProductosAleatorios.mockResolvedValue([producto(1), producto(2)]);

    renderizarHome();

    expect(await screen.findByText("Alojamiento 1")).toBeInTheDocument();
    expect(screen.getByText("Alojamiento 2")).toBeInTheDocument();
  });

  it("pide como máximo 10 recomendaciones", async () => {
    renderizarHome();

    await waitFor(() => expect(listarProductosAleatorios).toHaveBeenCalledWith(10));
  });

  it("muestra el catálogo completo antes de buscar", async () => {
    listarProductos.mockResolvedValue(pagina([producto(3)]));

    renderizarHome();

    expect(await screen.findByRole("heading", { name: /todos los alojamientos/i })).toBeInTheDocument();
    await waitFor(() => expect(listarProductos).toHaveBeenCalledWith(0, 10, [], null, null));
  });

  it("mantiene visibles las categorías y las recomendaciones", async () => {
    renderizarHome();

    expect(await screen.findByRole("heading", { name: "Categorías" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recomendados para vos/i })).toBeInTheDocument();
  });

  // --- Búsqueda (historia #22) --------------------------------------------

  it("busca los alojamientos del destino elegido", async () => {
    listarProductos.mockResolvedValue(pagina([producto(1)]));

    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario);

    await waitFor(() => expect(listarProductos).toHaveBeenLastCalledWith(0, 10, [], BARILOCHE.id, expect.objectContaining({ ciudad: BARILOCHE })));
    expect(await screen.findByRole("heading", { name: /alojamientos en bariloche/i })).toBeInTheDocument();
  });

  it("al buscar siguen estando las categorías y las recomendaciones", async () => {
    listarProductos.mockResolvedValue(pagina([producto(1)]));

    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario);

    expect(await screen.findByRole("heading", { name: /alojamientos en bariloche/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Categorías" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recomendados para vos/i })).toBeInTheDocument();
  });

  it("combina el destino con el filtro por categoría", async () => {
    listarProductos.mockResolvedValue(pagina([producto(1)]));

    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario);
    await usuario.click(await screen.findByRole("button", { name: /cabañas/i }));

    await waitFor(() =>
      expect(listarProductos).toHaveBeenLastCalledWith(0, 10, [CABANIAS.id], BARILOCHE.id, expect.objectContaining({ ciudad: BARILOCHE }))
    );
  });

  it("avisa cuando el destino no tiene alojamientos", async () => {
    listarProductos.mockResolvedValue(pagina([]));

    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario);

    expect(await screen.findByText(/no encontramos alojamientos disponibles en bariloche/i)).toBeInTheDocument();
  });

  it("vuelve al catálogo completo al quitar la búsqueda", async () => {
    listarProductos.mockResolvedValue(pagina([producto(1)]));

    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario);

    await usuario.click(await screen.findByRole("button", { name: /ver todos los destinos/i }));

    expect(await screen.findByRole("heading", { name: /todos los alojamientos/i })).toBeInTheDocument();
    await waitFor(() => expect(listarProductos).toHaveBeenLastCalledWith(0, 10, [], null, null));
  });

  it("muestra el paginador cuando hay más de una página", async () => {
    listarProductos.mockResolvedValue(
      pagina([producto(1)], { totalElementos: 12, totalSinFiltro: 12, totalPaginas: 2, ultima: false })
    );

    renderizarHome();

    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
  });

  it("avisa si la API falla en vez de quedarse cargando", async () => {
    listarProductosAleatorios.mockRejectedValue(new Error("sin conexión"));
    listarProductos.mockRejectedValue(new Error("sin conexión"));

    renderizarHome();

    expect(await screen.findByText(/no se pudo/i)).toBeInTheDocument();
  });
});
