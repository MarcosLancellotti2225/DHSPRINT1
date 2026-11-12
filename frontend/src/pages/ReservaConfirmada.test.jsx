import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ReservaConfirmada from "./ReservaConfirmada";

const RESERVA = {
  id: 42,
  producto: "Cabaña del Lago",
  entrada: "2026-12-10",
  salida: "2026-12-13",
  huespedes: 2,
  noches: 3,
  total: 150000,
};

function renderizar(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/reserva-confirmada", state }]}>
      <Routes>
        <Route path="/reserva-confirmada" element={<ReservaConfirmada />} />
        <Route path="/mis-reservas" element={<p>Historial de reservas</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Reserva confirmada", () => {
  it("muestra el detalle de lo reservado", () => {
    renderizar({ reserva: RESERVA });

    expect(screen.getByRole("heading", { name: /tu reserva está confirmada/i })).toBeInTheDocument();
    expect(screen.getByText("Cabaña del Lago")).toBeInTheDocument();
    expect(screen.getByText(/10 de diciembre de 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("manda al historial si se entra sin una reserva recién hecha", () => {
    // Pasa al recargar la página o al entrar por la URL a mano: no hay nada que confirmar.
    renderizar(undefined);

    expect(screen.getByText(/historial de reservas/i)).toBeInTheDocument();
  });
});
