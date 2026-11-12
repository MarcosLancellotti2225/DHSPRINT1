import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Reservar, { enTextoLargo, validarEstadia } from "./Reservar";
import { obtenerProducto } from "../api/productos";
import { crearReserva } from "../api/reservas";

vi.mock("../api/productos", async () => {
  const real = await vi.importActual("../api/productos");
  return { ...real, obtenerProducto: vi.fn() };
});
vi.mock("../api/reservas", () => ({ crearReserva: vi.fn() }));

const navegar = vi.fn();
vi.mock("react-router-dom", async () => {
  const real = await vi.importActual("react-router-dom");
  return { ...real, useNavigate: () => navegar };
});

vi.mock("../hooks/useSesion", () => ({
  default: () => ({
    usuario: {
      id: 3,
      nombre: "Ana",
      apellido: "García",
      email: "ana@ejemplo.com",
    },
    autenticado: true,
  }),
}));

const PRODUCTO = {
  id: 5,
  nombre: "Cabaña del Lago",
  descripcion: "Una cabaña junto al lago.",
  capacidad: 6,
  precioPorNoche: 50000,
  ciudad: { id: 1, nombre: "Bariloche", pais: "Argentina" },
  categoria: { id: 7, titulo: "Cabañas" },
  caracteristicas: [],
  imagenes: [{ id: 1, url: "/uploads/foto.png" }],
  puntuacion: 0,
  valoraciones: 0,
};

function renderizar(busqueda = "?entrada=2026-12-10&salida=2026-12-13&huespedes=2") {
  return render(
    <MemoryRouter initialEntries={[`/reservar/5${busqueda}`]}>
      <Routes>
        <Route path="/reservar/:id" element={<Reservar />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("validarEstadia", () => {
  it("acepta un rango coherente dentro de la capacidad", () => {
    expect(
      validarEstadia({ entrada: "2026-12-10", salida: "2026-12-13", huespedes: 4 }, 6)
    ).toBe("");
  });

  it("rechaza la salida anterior o igual a la entrada", () => {
    expect(
      validarEstadia({ entrada: "2026-12-13", salida: "2026-12-10", huespedes: 2 }, 6)
    ).toMatch(/posterior/i);
  });

  it("rechaza más huéspedes que la capacidad del alojamiento", () => {
    expect(
      validarEstadia({ entrada: "2026-12-10", salida: "2026-12-13", huespedes: 9 }, 6)
    ).toMatch(/hasta 6 huéspedes/i);
  });

  it("avisa si faltan las fechas", () => {
    expect(validarEstadia({ entrada: "", salida: "", huespedes: 2 }, 6)).toMatch(/faltan las fechas/i);
  });
});

describe("enTextoLargo", () => {
  it("escribe la fecha para leer", () => {
    expect(enTextoLargo("2026-12-10")).toMatch(/10 de diciembre de 2026/i);
  });

  it("tolera que no haya fecha", () => {
    expect(enTextoLargo("")).toBe("");
  });
});

describe("Página de reserva", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerProducto.mockResolvedValue(PRODUCTO);
  });

  it("muestra el alojamiento, los datos del usuario y la estadía", async () => {
    renderizar();

    expect(await screen.findByText("Cabaña del Lago")).toBeInTheDocument();
    expect(screen.getByText(/ana garcía/i)).toBeInTheDocument();
    expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByText(/10 de diciembre de 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/13 de diciembre de 2026/i)).toBeInTheDocument();
  });

  it("calcula el total como precio por noche por la cantidad de noches", async () => {
    renderizar();

    // 50.000 por noche × 3 noches = 150.000
    await waitFor(() => expect(screen.getByText(/150\.000/)).toBeInTheDocument());
  });

  it("crea la reserva y lleva a la confirmación", async () => {
    const reserva = { id: 9, producto: "Cabaña del Lago", entrada: "2026-12-10", salida: "2026-12-13" };
    crearReserva.mockResolvedValue(reserva);

    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(await screen.findByRole("button", { name: /confirmar reserva/i }));

    await waitFor(() =>
      expect(crearReserva).toHaveBeenCalledWith({
        productoId: 5,
        entrada: "2026-12-10",
        salida: "2026-12-13",
        huespedes: 2,
      })
    );
    expect(navegar).toHaveBeenCalledWith(
      "/reserva-confirmada",
      expect.objectContaining({ replace: true, state: expect.objectContaining({ reserva }) })
    );
  });

  it("muestra el error del backend sin salir de la página", async () => {
    crearReserva.mockRejectedValue({
      response: { status: 409, data: { mensaje: "Esas fechas ya están reservadas" } },
    });

    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(await screen.findByRole("button", { name: /confirmar reserva/i }));

    expect(await screen.findByText(/esas fechas ya están reservadas/i)).toBeInTheDocument();
    expect(navegar).not.toHaveBeenCalled();
  });

  it("no deja confirmar si piden más huéspedes que la capacidad", async () => {
    renderizar("?entrada=2026-12-10&salida=2026-12-13&huespedes=12");

    expect(await screen.findByText(/hasta 6 huéspedes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar reserva/i })).toBeDisabled();
  });
});
