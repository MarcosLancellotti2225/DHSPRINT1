import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModalCompartir from "./ModalCompartir";

const HOTEL = {
  id: 7,
  nombre: "Hotel del Valle",
  descripcion: "Un hotel de montaña con vista al valle.",
  imagenes: [{ id: 1, url: "/uploads/foto.png" }],
};

describe("Compartir en redes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
  });

  it("muestra la imagen, la descripción y el enlace del alojamiento", () => {
    render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Hotel del Valle")).toBeInTheDocument();
    expect(screen.getByText(/hotel de montaña/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hotel del Valle" })).toBeInTheDocument();
    expect(screen.getByText(window.location.href)).toBeInTheDocument();
  });

  it("ofrece elegir entre varias redes, con su logo", () => {
    const { container } = render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    expect(screen.getByRole("button", { name: /compartir en facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir en x/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir en whatsapp/i })).toBeInTheDocument();
    expect(container.querySelectorAll(".compartir__red svg")).toHaveLength(3);
  });

  it("muestra el enlace a la vista para mandarlo por cualquier medio", () => {
    render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    const campo = screen.getByLabelText(/copiá el enlace/i);
    expect(campo).toHaveValue(window.location.href);
    expect(campo).toHaveAttribute("readonly");
  });

  it("propone un mensaje y deja editarlo", async () => {
    const usuario = userEvent.setup();
    render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    const mensaje = screen.getByLabelText(/tu mensaje/i);
    expect(mensaje).toHaveValue("Mirá este alojamiento en NextHome: Hotel del Valle");

    await usuario.clear(mensaje);
    await usuario.type(mensaje, "Che, mirá esto");
    expect(mensaje).toHaveValue("Che, mirá esto");
  });

  it("abre la red elegida con el enlace y el mensaje", async () => {
    const usuario = userEvent.setup();
    render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    await usuario.click(screen.getByRole("button", { name: /compartir en facebook/i }));

    expect(window.open).toHaveBeenCalledTimes(1);
    const [destino, , opciones] = window.open.mock.calls[0];
    expect(destino).toContain("facebook.com/sharer");
    expect(destino).toContain(encodeURIComponent(window.location.href));
    expect(destino).toContain(encodeURIComponent("Hotel del Valle"));
    expect(opciones).toContain("noopener");
  });

  it("comparte el mensaje editado, no el propuesto", async () => {
    const usuario = userEvent.setup();
    render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    await usuario.clear(screen.getByLabelText(/tu mensaje/i));
    await usuario.type(screen.getByLabelText(/tu mensaje/i), "Mensaje propio");
    await usuario.click(screen.getByRole("button", { name: /compartir en x/i }));

    expect(window.open.mock.calls[0][0]).toContain(encodeURIComponent("Mensaje propio"));
  });

  it("copia el enlace al portapapeles", async () => {
    const usuario = userEvent.setup();

    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: escribir },
      configurable: true,
    });

    render(<ModalCompartir producto={HOTEL} onCerrar={vi.fn()} />);

    await usuario.click(screen.getByRole("button", { name: /^copiar$/i }));

    expect(escribir).toHaveBeenCalledWith(expect.stringContaining(window.location.href));
    expect(await screen.findByRole("button", { name: /copiado/i })).toBeInTheDocument();
  });

  it("se cierra con el botón", async () => {
    const onCerrar = vi.fn();
    const usuario = userEvent.setup();
    render(<ModalCompartir producto={HOTEL} onCerrar={onCerrar} />);

    await usuario.click(screen.getByRole("button", { name: /cerrar/i }));

    expect(onCerrar).toHaveBeenCalled();
  });
});
