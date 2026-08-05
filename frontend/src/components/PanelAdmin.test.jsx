import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PanelAdmin from "./PanelAdmin";

/** Simula el ancho del viewport para el hook usePantallaChica. */
function simularAncho(ancho) {
  window.matchMedia = vi.fn().mockImplementation((consulta) => {
    const maximo = Number(consulta.match(/max-width:\s*(\d+)px/)?.[1] ?? 0);
    return {
      matches: ancho <= maximo,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });
}

function renderizarPanel() {
  return render(
    <MemoryRouter>
      <PanelAdmin titulo="Lista de productos">
        <p>Contenido del panel</p>
      </PanelAdmin>
    </MemoryRouter>
  );
}

describe("PanelAdmin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("en desktop muestra el contenido normalmente", () => {
    simularAncho(1280);
    renderizarPanel();

    expect(screen.getByText("Contenido del panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lista de productos" })).toBeInTheDocument();
  });

  it("en mobile bloquea el panel y avisa que no está disponible", () => {
    simularAncho(390);
    renderizarPanel();

    expect(screen.getByText(/panel no disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/no está disponible en dispositivos móviles/i)).toBeInTheDocument();
    expect(screen.queryByText("Contenido del panel")).not.toBeInTheDocument();
  });

  it("justo por debajo de 768px sigue bloqueado", () => {
    simularAncho(767);
    renderizarPanel();
    expect(screen.queryByText("Contenido del panel")).not.toBeInTheDocument();
  });

  it("a partir de 768px ya se puede usar", () => {
    simularAncho(768);
    renderizarPanel();
    expect(screen.getByText("Contenido del panel")).toBeInTheDocument();
  });
});
