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

  it("con 'Ver más' abre el carrusel con todas las imágenes", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);

    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));

    const modal = screen.getByRole("dialog");
    // El carrusel muestra una foto grande por vez, pero dice cuántas hay.
    expect(within(modal).getByText("1 de 6")).toBeInTheDocument();
    // Una miniatura por imagen, para saltar a cualquiera.
    expect(within(modal).getAllByRole("button", { name: /ver imagen/i })).toHaveLength(6);
  });

  // Tocar una foto abre el carrusel en esa foto, no siempre en la primera.
  it("abre el carrusel en la imagen que se toco", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);

    await userEvent.click(screen.getByRole("button", { name: /imagen 3$/i }));

    expect(within(screen.getByRole("dialog")).getByText("3 de 6")).toBeInTheDocument();
  });

  it("avanza y retrocede con las flechas", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);
    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    const modal = screen.getByRole("dialog");

    await userEvent.click(within(modal).getByRole("button", { name: /imagen siguiente/i }));
    expect(within(modal).getByText("2 de 6")).toBeInTheDocument();

    await userEvent.click(within(modal).getByRole("button", { name: /imagen anterior/i }));
    expect(within(modal).getByText("1 de 6")).toBeInTheDocument();
  });

  // Da la vuelta en los extremos: de la primera hacia atrás se llega a la última.
  it("da la vuelta al pasar del primer o ultimo lugar", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);
    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    const modal = screen.getByRole("dialog");

    await userEvent.click(within(modal).getByRole("button", { name: /imagen anterior/i }));
    expect(within(modal).getByText("6 de 6")).toBeInTheDocument();

    await userEvent.click(within(modal).getByRole("button", { name: /imagen siguiente/i }));
    expect(within(modal).getByText("1 de 6")).toBeInTheDocument();
  });

  it("se mueve con las flechas del teclado", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);
    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    const modal = screen.getByRole("dialog");

    await userEvent.keyboard("{ArrowRight}");
    expect(within(modal).getByText("2 de 6")).toBeInTheDocument();

    await userEvent.keyboard("{ArrowLeft}");
    expect(within(modal).getByText("1 de 6")).toBeInTheDocument();
  });

  it("salta a una imagen desde su miniatura", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);
    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    const modal = screen.getByRole("dialog");

    await userEvent.click(within(modal).getByRole("button", { name: /ver imagen 4/i }));

    expect(within(modal).getByText("4 de 6")).toBeInTheDocument();
  });

  // Con una sola foto no hay a dónde ir.
  it("con una sola imagen no muestra flechas ni miniaturas", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={[seisImagenes[0]]} />);

    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    const modal = screen.getByRole("dialog");

    expect(within(modal).queryByRole("button", { name: /imagen siguiente/i })).not.toBeInTheDocument();
    expect(within(modal).queryByRole("button", { name: /ver imagen/i })).not.toBeInTheDocument();
    expect(within(modal).getByText("1 de 1")).toBeInTheDocument();
  });

  it("el modal se cierra con su botón de cerrar", async () => {
    render(<GaleriaImagenes nombre="Hotel del Valle" imagenes={seisImagenes} />);

    await userEvent.click(screen.getByRole("button", { name: /ver más/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^cerrar$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
