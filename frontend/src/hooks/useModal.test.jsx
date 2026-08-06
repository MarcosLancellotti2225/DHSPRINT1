import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModalConfirmacion from "../components/ModalConfirmacion";

function Escenario({ onCancelar = () => {}, onConfirmar = () => {}, abierto = true }) {
  return (
    <>
      <button type="button">Boton de la pagina de atras</button>
      {abierto && (
        <ModalConfirmacion
          titulo="Eliminar producto"
          mensaje="¿Seguro?"
          textoConfirmar="Eliminar producto"
          onConfirmar={onConfirmar}
          onCancelar={onCancelar}
        />
      )}
    </>
  );
}

describe("Comportamiento de los modales", () => {
  it("al abrirse lleva el foco adentro del modal", () => {
    render(<Escenario />);

    const modal = screen.getByRole("dialog");
    expect(modal).toContainElement(document.activeElement);
  });

  it("el Tab no se escapa al contenido de atrás", async () => {
    const usuario = userEvent.setup();
    render(<Escenario />);

    const cancelar = screen.getByRole("button", { name: /cancelar/i });
    const eliminar = screen.getByRole("button", { name: /eliminar producto/i });
    const atras = screen.getByRole("button", { name: /boton de la pagina de atras/i });

    expect(document.activeElement).toBe(cancelar);

    await usuario.tab();
    expect(document.activeElement).toBe(eliminar);

    // Desde el último control vuelve al primero, no salta al botón de atrás.
    await usuario.tab();
    expect(document.activeElement).toBe(cancelar);
    expect(document.activeElement).not.toBe(atras);
  });

  it("con Shift+Tab desde el primero va al último", async () => {
    const usuario = userEvent.setup();
    render(<Escenario />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: /cancelar/i }));

    await usuario.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /eliminar producto/i }));
  });

  it("se cierra con Escape", async () => {
    const alCancelar = vi.fn();
    const usuario = userEvent.setup();
    render(<Escenario onCancelar={alCancelar} />);

    await usuario.keyboard("{Escape}");
    expect(alCancelar).toHaveBeenCalled();
  });

  it("bloquea el scroll del fondo mientras está abierto y lo restaura al cerrar", () => {
    const { rerender } = render(<Escenario />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Escenario abierto={false} />);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("al cerrarse devuelve el foco a donde estaba antes", async () => {
    const usuario = userEvent.setup();
    const { rerender } = render(<Escenario abierto={false} />);

    const atras = screen.getByRole("button", { name: /boton de la pagina de atras/i });
    await usuario.click(atras);
    expect(document.activeElement).toBe(atras);

    rerender(<Escenario abierto={true} />);
    expect(document.activeElement).not.toBe(atras);

    rerender(<Escenario abierto={false} />);
    expect(document.activeElement).toBe(atras);
  });
});
