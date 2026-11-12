import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
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

/** Deja a la vista la URL actual, para comprobar a dónde navega el buscador. */
function UrlActual() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{`${pathname}${search}`}</output>;
}

function renderizarHome() {
  return render(
    <MemoryRouter>
      <Home />
      <UrlActual />
    </MemoryRouter>
  );
}

function urlActual() {
  return screen.getByTestId("url").textContent;
}

async function buscarBariloche(usuario, { huespedes, entrada, salida } = {}) {
  const destino = await screen.findByLabelText(/destino/i);
  await usuario.type(destino, "bari");
  await usuario.click(await screen.findByRole("option", { name: /bariloche/i }));

  if (entrada) await usuario.type(screen.getByLabelText(/check-in/i), entrada);
  if (salida) await usuario.type(screen.getByLabelText(/check-out/i), salida);

  if (huespedes !== undefined) {
    const campo = screen.getByLabelText(/huéspedes/i);
    await usuario.clear(campo);
    await usuario.type(campo, String(huespedes));
  }

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
    await waitFor(() => expect(listarProductos).toHaveBeenCalledWith(0, 10, []));
  });

  it("mantiene visibles las categorías y las recomendaciones", async () => {
    renderizarHome();

    expect(await screen.findByRole("heading", { name: "Categorías" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recomendados para vos/i })).toBeInTheDocument();
  });

  // --- Búsqueda (historia #22) --------------------------------------------
  //
  // La home no filtra: buscar lleva a /busqueda con los criterios en la URL.
  // Que los resultados aparezcan y se puedan seguir filtrando se prueba en
  // Busqueda.test.jsx.

  it("lleva a la pagina de busqueda con el destino elegido", async () => {
    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario);

    await waitFor(() => expect(urlActual()).toContain("/busqueda"));
    expect(urlActual()).toContain(`ciudad=${BARILOCHE.id}`);
  });

  it("lleva las fechas y los huespedes a la busqueda", async () => {
    const usuario = userEvent.setup();
    renderizarHome();
    await buscarBariloche(usuario, { huespedes: 4, entrada: "2030-01-10", salida: "2030-01-12" });

    await waitFor(() => expect(urlActual()).toContain("/busqueda"));
    const url = urlActual();
    expect(url).toContain("entrada=2030-01-10");
    expect(url).toContain("salida=2030-01-12");
    expect(url).toContain("huespedes=4");
  });

  it("lleva las categorias elegidas en la home a la busqueda", async () => {
    const usuario = userEvent.setup();
    renderizarHome();

    await usuario.click(await screen.findByRole("button", { name: /cabañas/i }));
    await buscarBariloche(usuario);

    await waitFor(() => expect(urlActual()).toContain("/busqueda"));
    expect(urlActual()).toContain(`categorias=${CABANIAS.id}`);
  });

  it("no navega si no se eligio un destino", async () => {
    const usuario = userEvent.setup();
    renderizarHome();

    await usuario.click(await screen.findByRole("button", { name: /realizar búsqueda/i }));

    expect(await screen.findByText(/elegí un destino/i)).toBeInTheDocument();
    expect(urlActual()).toBe("/");
  });

  it("filtra el catalogo por categoria sin salir de la home", async () => {
    const usuario = userEvent.setup();
    renderizarHome();

    await usuario.click(await screen.findByRole("button", { name: /cabañas/i }));

    await waitFor(() =>
      expect(listarProductos).toHaveBeenLastCalledWith(0, 10, [CABANIAS.id])
    );
    expect(urlActual()).toBe("/");
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
