import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BotonWhatsApp from "./BotonWhatsApp";

describe("Botón de WhatsApp", () => {
  it("enlaza a wa.me con un mensaje ya escrito", () => {
    render(<BotonWhatsApp />);

    const enlace = screen.getByRole("link", { name: /whatsapp/i });
    expect(enlace).toHaveAttribute("href", expect.stringContaining("https://wa.me/"));
    expect(enlace.getAttribute("href")).toMatch(/[?&]text=/);
  });

  it("abre en otra pestaña sin exponer la ventana de origen", () => {
    render(<BotonWhatsApp />);

    const enlace = screen.getByRole("link", { name: /whatsapp/i });
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace.getAttribute("rel")).toContain("noopener");
  });
});
