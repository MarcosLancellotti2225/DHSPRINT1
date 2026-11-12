import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MisReservas, { separarPorEstado } from "./MisReservas";
import { listarMisReservas } from "../api/reservas";

vi.mock("../api/reservas", () => ({ listarMisReservas: vi.fn() }));

function reserva(id, extra = {}) {
  return {
    id,
    productoId: id * 10,
    producto: `Alojamiento ${id}`,
    entrada: "2026-12-10",
    salida: "2026-12-13",
    huespedes: 2,
    noches: 3,
    precioPorNoche: 50000,
    total: 150000,
    finalizada: false,
    ...extra,
  };
}

function renderizar() {
  return render(
    <MemoryRouter>
      <MisReservas />
    </MemoryRouter>
  );
}

describe("separarPorEstado", () => {
  it("separa las próximas de las ya finalizadas", () => {
    const { proximas, pasadas } = separarPorEstado([
      reserva(1),
      reserva(2, { finalizada: true }),
      reserva(3),
    ]);

    expect(proximas.map((r) => r.id)).toEqual([1, 3]);
    expect(pasadas.map((r) => r.id)).toEqual([2]);
  });

  it("no rompe con una lista vacía", () => {
    expect(separarPorEstado([])).toEqual({ proximas: [], pasadas: [] });
  });
});

describe("Mis reservas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista las reservas con sus fechas y su total", async () => {
    listarMisReservas.mockResolvedValue([reserva(1)]);
    renderizar();

    expect(await screen.findByText("Alojamiento 1")).toBeInTheDocument();
    expect(screen.getByText(/10 de diciembre de 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
  });

  it("separa en próximas y anteriores", async () => {
    listarMisReservas.mockResolvedValue([reserva(1), reserva(2, { finalizada: true })]);
    renderizar();

    expect(await screen.findByRole("heading", { name: /próximas estadías/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /estadías anteriores/i })).toBeInTheDocument();
  });

  it("invita a buscar cuando todavía no hay reservas", async () => {
    listarMisReservas.mockResolvedValue([]);
    renderizar();

    expect(await screen.findByText(/todavía no hiciste ninguna reserva/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buscar alojamientos/i })).toBeInTheDocument();
  });

  it("avisa si no se pudieron cargar", async () => {
    listarMisReservas.mockRejectedValue(new Error("sin red"));
    renderizar();

    expect(await screen.findByText(/no se pudieron cargar tus reservas/i)).toBeInTheDocument();
  });
});
