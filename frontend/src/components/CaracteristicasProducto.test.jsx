import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CaracteristicasProducto from "./CaracteristicasProducto";

const CARACTERISTICAS = [
  { id: 1, nombre: "Wi-Fi", icono: "wifi" },
  { id: 2, nombre: "Pileta", icono: "pileta" },
  { id: 3, nombre: "Algo nuevo", icono: "icono-desconocido" },
];

describe("Bloque de características del detalle", () => {
  it("muestra el título y todas las características del alojamiento", () => {
    render(<CaracteristicasProducto caracteristicas={CARACTERISTICAS} />);

    expect(screen.getByRole("heading", { name: "Características" })).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
    expect(screen.getByText("Pileta")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("dibuja un ícono para cada característica", () => {
    const { container } = render(<CaracteristicasProducto caracteristicas={CARACTERISTICAS} />);

    expect(container.querySelectorAll(".caracteristicas__item svg")).toHaveLength(3);
  });

  it("avisa cuando el alojamiento no tiene características cargadas", () => {
    render(<CaracteristicasProducto caracteristicas={[]} />);

    expect(screen.getByRole("heading", { name: "Características" })).toBeInTheDocument();
    expect(screen.getByText(/todavía no tiene características/i)).toBeInTheDocument();
  });
});
