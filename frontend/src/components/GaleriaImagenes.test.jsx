import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GaleriaImagenes from "./GaleriaImagenes";

const seisImagenes = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  url: `/uploads/foto-${i + 1}.png`,
}));

describe("GaleriaImagenes", () => {
  it("muestra sólo 5 imágenes: la principal más 4 en la grilla", () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);

    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(screen.getByAltText("Hotel del Valle, imagen principal")).toBeInTheDocument();
  });

  it("avisa cuando el alojamiento todavía no tiene imágenes", () => {
    render(<GaleriaImagenes nombre="Hotel Sin Fotos" imagenes={[]} />);

    expect(screen.getByText(/todavía no tiene imágenes/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("con 'Ver más' abre un modal con todas las imágenes disponibles", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);

    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));

    const modal = screen.getByRole("dialog");
    // Las 6, no las 5 que se ven en la galería.
    expect(within(modal).getAllByRole("img")).toHaveLength(6);
  });

  it("el modal se cierra con su botón de cerrar", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);

    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /cerrar galería/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
