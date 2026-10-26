import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Estrellas from "./Estrellas";

describe("Estrellas", () => {
  it("sin onElegir son de sólo lectura", () => {
    render(<Estrellas valor={4} />);

    expect(screen.getByRole("img", { name: /4 de 5 estrellas/i })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("con onElegir se puede puntuar de 1 a 5", async () => {
    const onElegir = vi.fn();
    const usuario = userEvent.setup();
    render(<Estrellas valor={0} onElegir={onElegir} />);

    const opciones = screen.getAllByRole("radio");
    expect(opciones).toHaveLength(5);

    await usuario.click(screen.getByRole("radio", { name: "4 estrellas" }));
    expect(onElegir).toHaveBeenCalledWith(4);
  });

  it("marca la puntuación elegida", () => {
    render(<Estrellas valor={3} onElegir={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "3 estrellas" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "5 estrellas" })).toHaveAttribute("aria-checked", "false");
  });

  it("concuerda el singular con una sola estrella", () => {
    render(<Estrellas valor={1} onElegir={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "1 estrella" })).toBeInTheDocument();
  });
});
