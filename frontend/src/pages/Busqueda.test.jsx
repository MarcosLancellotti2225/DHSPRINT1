import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Busqueda from "./Busqueda";
import { buscarProductos } from "../api/productos";
import { listarCategorias } from "../api/categorias";
import { listarCiudades } from "../api/ciudades";
import { listarCaracteristicas } from "../api/caracteristicas";

vi.mock("../api/productos", async () => {
  const real = await vi.importActual("../api/productos");
  return { ...real, buscarProductos: vi.fn() };
});
vi.mock("../api/categorias", () => ({ listarCategorias: vi.fn() }));
vi.mock("../api/ciudades", () => ({ listarCiudades: vi.fn() }));
vi.mock("../api/caracteristicas", () => ({ listarCaracteristicas: vi.fn() }));

// El corazón de favoritos necesita sesión y contexto; acá se prueba la búsqueda.
vi.mock("../components/BotonFavorito", () => ({ default: () => null }));

const BARILOCHE = { id: 1, nombre: "Bariloche", pais: "Argentina" };
const MENDOZA = { id: 2, nombre: "Mendoza", pais: "Argentina" };
const CABANIAS = { id: 7, titulo: "Cabañas", descripcion: "En el bosque." };
const HOTELES = { id: 8, titulo: "Hoteles", descripcion: "Con servicio." };
const PILETA = { id: 11, nombre: "Pileta", icono: "pool" };
const COCHERA = { id: 12, nombre: "Cochera", icono: "car" };

function producto(id) {
  return {
    id,
    nombre: `Alojamiento ${id}`,
    descripcion: `Descripción del alojamiento ${id}`,
    ciudad: BARILOCHE,
    categoria: CABANIAS,
    capacidad: 4,
    precioPorNoche: 80000,
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

/** Deja a la vista la URL actual: los filtros viven ahí, así que es lo que se verifica. */
function UrlActual() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{`${pathname}${search}`}</output>;
}

function renderizar(query = "") {
  return render(
    <MemoryRouter initialEntries={[`/busqueda${query}`]}>
      <Routes>
        <Route path="/busqueda" element={<Busqueda />} />
      </Routes>
      <UrlActual />
    </MemoryRouter>
  );
}

function urlActual() {
  return screen.getByTestId("url").textContent;
}

/** Los criterios del último pedido al backend. */
function ultimaBusqueda() {
  const llamadas = buscarProductos.mock.calls;
  return llamadas[llamadas.length - 1][0];
}

describe("Busqueda", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCiudades.mockResolvedValue([BARILOCHE, MENDOZA]);
    listarCategorias.mockResolvedValue([CABANIAS, HOTELES]);
    listarCaracteristicas.mockResolvedValue([PILETA, COCHERA]);
    buscarProductos.mockResolvedValue(pagina([producto(1)]));
  });

  // --- Los filtros se leen de la URL --------------------------------------

  it("busca con los filtros que vienen en la URL", async () => {
    renderizar("?ciudad=1&entrada=2030-01-10&salida=2030-01-12&huespedes=4");

    await waitFor(() => expect(buscarProductos).toHaveBeenCalled());
    expect(ultimaBusqueda()).toMatchObject({
      ciudadId: 1,
      entrada: "2030-01-10",
      salida: "2030-01-12",
      huespedes: 4,
    });
  });

  it("muestra los resultados de entrada, sin hacer falta buscar", async () => {
    renderizar("?ciudad=1");

    expect(await screen.findByText("Alojamiento 1")).toBeInTheDocument();
  });

  it("nombra el destino buscado en el titulo", async () => {
    renderizar("?ciudad=1");

    expect(
      await screen.findByRole("heading", { name: /alojamientos en bariloche/i })
    ).toBeInTheDocument();
  });

  it("sin destino busca en todo el catalogo", async () => {
    renderizar("");

    expect(
      await screen.findByRole("heading", { name: /todos los alojamientos/i })
    ).toBeInTheDocument();
    await waitFor(() => expect(ultimaBusqueda().ciudadId).toBeNull());
  });

  it("precarga el buscador con el destino de la URL", async () => {
    renderizar("?ciudad=1");

    await waitFor(() =>
      expect(screen.getByLabelText(/destino/i)).toHaveValue("Bariloche, Argentina")
    );
  });

  it("muestra cuantos resultados hay", async () => {
    buscarProductos.mockResolvedValue(pagina([producto(1), producto(2)]));

    renderizar("?ciudad=1");

    expect(await screen.findByText(/2 alojamientos/i)).toBeInTheDocument();
  });

  // --- Filtrar sube el filtro a la URL ------------------------------------

  it("filtra por categoria y lo deja en la URL", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await usuario.click(await screen.findByRole("checkbox", { name: /cabañas/i }));

    await waitFor(() => expect(urlActual()).toContain(`categorias=${CABANIAS.id}`));
    // La búsqueda sale después de la espera, no con el click.
    await waitFor(() => expect(ultimaBusqueda().categorias).toEqual([CABANIAS.id]));
  });

  it("filtra por caracteristica y lo deja en la URL", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await usuario.click(await screen.findByRole("checkbox", { name: /pileta/i }));

    await waitFor(() => expect(urlActual()).toContain(`caracteristicas=${PILETA.id}`));
    await waitFor(() => expect(ultimaBusqueda().caracteristicas).toEqual([PILETA.id]));
  });

  it("destilda una categoria ya elegida", async () => {
    const usuario = userEvent.setup();
    renderizar(`?ciudad=1&categorias=${CABANIAS.id}`);

    await usuario.click(await screen.findByRole("checkbox", { name: /cabañas/i }));

    await waitFor(() => expect(urlActual()).not.toContain("categorias"));
  });

  it("filtra por huespedes", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    // "Huéspedes" está en el buscador de arriba y en el panel: el del panel es
    // el que aplica el filtro al instante.
    const campo = await screen.findByLabelText(/huéspedes/i, { selector: "#filtro-huespedes" });
    await usuario.clear(campo);
    await usuario.type(campo, "6");

    await waitFor(() => expect(urlActual()).toContain("huespedes=6"));
  });

  // El precio se confirma y no se aplica al tipear: escribir "1" de camino a
  // "10000" dispararia busquedas que nadie pidio.
  it("aplica el rango de precio al confirmarlo", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await usuario.type(await screen.findByLabelText(/desde/i), "50000");
    await usuario.type(screen.getByLabelText(/hasta/i), "90000");

    expect(urlActual()).not.toContain("precioMinimo");

    await usuario.click(screen.getByRole("button", { name: /aplicar precio/i }));

    await waitFor(() => expect(urlActual()).toContain("precioMinimo=50000"));
    expect(urlActual()).toContain("precioMaximo=90000");
  });

  it("avisa si el precio minimo es mayor al maximo", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await usuario.type(await screen.findByLabelText(/desde/i), "90000");
    await usuario.type(screen.getByLabelText(/hasta/i), "50000");
    await usuario.click(screen.getByRole("button", { name: /aplicar precio/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no puede ser mayor/i);
    expect(urlActual()).not.toContain("precioMinimo");
  });

  it("precarga el rango de precio que viene en la URL", async () => {
    renderizar("?ciudad=1&precioMinimo=50000&precioMaximo=90000");

    await waitFor(() => expect(screen.getByLabelText(/desde/i)).toHaveValue(50000));
    expect(screen.getByLabelText(/hasta/i)).toHaveValue(90000);
  });

  it("avisa que las caracteristicas se piden todas", async () => {
    renderizar(`?ciudad=1&caracteristicas=${PILETA.id}&caracteristicas=${COCHERA.id}`);

    expect(await screen.findByText(/tienen todas las características/i)).toBeInTheDocument();
  });

  it("vuelve a la primera pagina al cambiar un filtro", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1&pagina=2");

    await usuario.click(await screen.findByRole("checkbox", { name: /cabañas/i }));

    await waitFor(() => expect(urlActual()).not.toContain("pagina"));
  });

  // --- Espera antes de buscar ---------------------------------------------
  //
  // Sin esto cada click pegaba al backend al instante y la lista parpadeaba una
  // vez por filtro tildado.

  it("varios filtros seguidos disparan una sola busqueda", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await waitFor(() => expect(buscarProductos).toHaveBeenCalledTimes(1));

    await usuario.click(await screen.findByRole("checkbox", { name: /cabañas/i }));
    await usuario.click(screen.getByRole("checkbox", { name: /hoteles/i }));
    await usuario.click(screen.getByRole("checkbox", { name: /pileta/i }));

    // Los tres filtros ya están en la URL...
    await waitFor(() => expect(urlActual()).toContain(`caracteristicas=${PILETA.id}`));

    // ...pero la búsqueda sale una sola vez, con todos juntos.
    await waitFor(() => expect(buscarProductos).toHaveBeenCalledTimes(2));
    expect(ultimaBusqueda().categorias).toEqual([CABANIAS.id, HOTELES.id]);
    expect(ultimaBusqueda().caracteristicas).toEqual([PILETA.id]);
  });

  it("avisa que esta buscando mientras espera", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await screen.findByText("Alojamiento 1");

    await usuario.click(screen.getByRole("checkbox", { name: /cabañas/i }));

    expect(await screen.findByText(/buscando/i)).toBeInTheDocument();
  });

  // La lista anterior se queda puesta: reemplazarla por un cartel hacía
  // desaparecer la grilla y la página saltaba en cada click.
  it("no borra los resultados anteriores mientras busca", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await screen.findByText("Alojamiento 1");

    await usuario.click(screen.getByRole("checkbox", { name: /cabañas/i }));

    expect(screen.getByText(/buscando/i)).toBeInTheDocument();
    expect(screen.getByText("Alojamiento 1")).toBeInTheDocument();
  });

  // --- Limpiar y volver a buscar ------------------------------------------

  it("limpia los filtros pero conserva el destino", async () => {
    const usuario = userEvent.setup();
    renderizar(`?ciudad=1&huespedes=4&categorias=${CABANIAS.id}`);

    await usuario.click(await screen.findByRole("button", { name: /limpiar todo/i }));

    await waitFor(() => expect(urlActual()).toContain("ciudad=1"));
    expect(urlActual()).not.toContain("huespedes");
    expect(urlActual()).not.toContain("categorias");
  });

  it("no ofrece limpiar si no hay ningun filtro", async () => {
    renderizar("");

    await screen.findByRole("heading", { name: /filtros/i });
    expect(screen.queryByRole("button", { name: /limpiar todo/i })).not.toBeInTheDocument();
  });

  // Cambiar de destino no deberia soltar el precio que ya se habia elegido.
  it("al buscar otro destino conserva los filtros de la columna", async () => {
    const usuario = userEvent.setup();
    renderizar("?ciudad=1&precioMinimo=50000");

    const destino = await screen.findByLabelText(/destino/i);
    await usuario.clear(destino);
    await usuario.type(destino, "mendo");
    await usuario.click(await screen.findByRole("option", { name: /mendoza/i }));
    await usuario.click(screen.getByRole("button", { name: /realizar búsqueda/i }));

    await waitFor(() => expect(urlActual()).toContain(`ciudad=${MENDOZA.id}`));
    expect(urlActual()).toContain("precioMinimo=50000");
  });

  // --- Sin resultados -----------------------------------------------------

  it("avisa cuando ningun alojamiento coincide", async () => {
    buscarProductos.mockResolvedValue(pagina([]));

    renderizar("?ciudad=1");

    expect(await screen.findByText(/no encontramos alojamientos en bariloche/i)).toBeInTheDocument();
  });

  // Decir cual filtro dejo la lista vacia es lo que permite corregir la busqueda.
  it("ofrece quitar los huespedes cuando no hay resultados", async () => {
    buscarProductos.mockResolvedValue(pagina([]));

    const usuario = userEvent.setup();
    renderizar("?ciudad=1&huespedes=10");

    await usuario.click(await screen.findByRole("button", { name: /sin filtrar por huéspedes/i }));

    await waitFor(() => expect(urlActual()).not.toContain("huespedes"));
  });

  it("ofrece quitar el precio cuando no hay resultados", async () => {
    buscarProductos.mockResolvedValue(pagina([]));

    const usuario = userEvent.setup();
    renderizar("?ciudad=1&precioMinimo=500000");

    await usuario.click(await screen.findByRole("button", { name: /quitar el rango de precio/i }));

    await waitFor(() => expect(urlActual()).not.toContain("precioMinimo"));
  });

  it("ofrece quitar las caracteristicas cuando no hay resultados", async () => {
    buscarProductos.mockResolvedValue(pagina([]));

    const usuario = userEvent.setup();
    renderizar(`?ciudad=1&caracteristicas=${PILETA.id}`);

    await usuario.click(await screen.findByRole("button", { name: /quitar las características/i }));

    await waitFor(() => expect(urlActual()).not.toContain("caracteristicas"));
  });

  it("sin filtros que aflojar ofrece volver al inicio", async () => {
    buscarProductos.mockResolvedValue(pagina([]));

    renderizar("");

    expect(await screen.findByRole("link", { name: /volver al inicio/i })).toBeInTheDocument();
  });

  // --- Paginación ---------------------------------------------------------

  it("muestra el paginador cuando hay mas de una pagina", async () => {
    buscarProductos.mockResolvedValue(
      pagina([producto(1)], { totalElementos: 12, totalPaginas: 2, ultima: false })
    );

    renderizar("?ciudad=1");

    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
  });

  it("vuelve al principio de los resultados al cambiar de pagina", async () => {
    // Sin esto la página nueva arranca mostrando el final de la lista anterior.
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    buscarProductos.mockResolvedValue(
      pagina([producto(1)], { totalElementos: 12, totalPaginas: 2, ultima: false })
    );

    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await usuario.click(await screen.findByRole("button", { name: /adelante/i }));

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  });

  it("deja la pagina en la URL al avanzar", async () => {
    buscarProductos.mockResolvedValue(
      pagina([producto(1)], { totalElementos: 12, totalPaginas: 2, ultima: false })
    );

    const usuario = userEvent.setup();
    renderizar("?ciudad=1");

    await usuario.click(await screen.findByRole("button", { name: /adelante/i }));

    await waitFor(() => expect(urlActual()).toContain("pagina=2"));
    await waitFor(() => expect(ultimaBusqueda().pagina).toBe(1));
  });

  // --- Errores ------------------------------------------------------------

  it("avisa si la API falla en vez de quedarse cargando", async () => {
    buscarProductos.mockRejectedValue(new Error("sin conexión"));

    renderizar("?ciudad=1");

    expect(await screen.findByText(/no se pudo/i)).toBeInTheDocument();
  });

  it("sigue andando si no se pueden cargar los catalogos de filtros", async () => {
    listarCaracteristicas.mockRejectedValue(new Error("sin conexión"));
    listarCategorias.mockRejectedValue(new Error("sin conexión"));

    renderizar("?ciudad=1");

    expect(await screen.findByText("Alojamiento 1")).toBeInTheDocument();
  });
});
