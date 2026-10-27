import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarioDisponibilidad from "./CalendarioDisponibilidad";
import { obtenerDisponibilidad } from "../api/reservas";
import { aTexto } from "../utils/calendario";

vi.mock("../api/reservas", () => ({
  obtenerDisponibilidad: vi.fn(),
  crearReserva: vi.fn(),
  listarMisReservas: vi.fn(),
}));

/**
 * Un día del primer mes visible, elegido lejos de hoy para que nunca sea pasado
 * y siempre esté dentro de los dos meses que se dibujan.
 */
function diaDelMesVisible(offsetDias = 0) {
  const hoy = new Date();
  const base = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 5 + offsetDias);
  return { texto: aTexto(base), numero: base.getDate() };
}

function renderizar(props = {}) {
  const onSeleccionar = vi.fn();
  render(
    <CalendarioDisponibilidad
      productoId={7}
      seleccion={{ entrada: "", salida: "" }}
      onSeleccionar={onSeleccionar}
      {...props}
    />
  );
  return onSeleccionar;
}

/** Un día del mes visible, a `offset` días del quinto. */

describe("Calendario de disponibilidad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerDisponibilidad.mockResolvedValue({ productoId: 7, ocupadas: [] });
  });

  it("muestra dos meses a la vez", async () => {
    renderizar();

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalledWith(7));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });

  it("deshabilita las fechas ocupadas", async () => {
    const desde = diaDelMesVisible();
    const hasta = diaDelMesVisible(2);
    obtenerDisponibilidad.mockResolvedValue({
      productoId: 7,
      ocupadas: [{ entrada: desde.texto, salida: hasta.texto }],
    });

    renderizar();

    const ocupadas = await screen.findAllByRole("button", { name: /ocupado/i });
    expect(ocupadas).toHaveLength(2);
    ocupadas.forEach((celda) => expect(celda).toBeDisabled());
  });

  it("el primer clic fija la entrada y deja la salida abierta", async () => {
    const usuario = userEvent.setup();
    const onSeleccionar = renderizar();

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalled());

    const dia = diaDelMesVisible();
    const celdas = screen.getAllByRole("button", { name: new RegExp(`^${dia.numero} de `) });
    await usuario.click(celdas[celdas.length - 1]);

    expect(onSeleccionar).toHaveBeenCalledWith({ entrada: dia.texto, salida: "" });
  });

  it("el segundo clic fija la salida", async () => {
    const entrada = diaDelMesVisible();
    const usuario = userEvent.setup();
    const onSeleccionar = renderizar({
      seleccion: { entrada: entrada.texto, salida: "" },
    });

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalled());

    const salida = diaDelMesVisible(3);
    const celdas = screen.getAllByRole("button", { name: new RegExp(`^${salida.numero} de `) });
    await usuario.click(celdas[celdas.length - 1]);

    expect(onSeleccionar).toHaveBeenCalledWith({
      entrada: entrada.texto,
      salida: salida.texto,
    });
  });

  it("clickear antes de la entrada arranca un rango nuevo", async () => {
    const entrada = diaDelMesVisible(5);
    const usuario = userEvent.setup();
    const onSeleccionar = renderizar({
      seleccion: { entrada: entrada.texto, salida: "" },
    });

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalled());

    const anterior = diaDelMesVisible(1);
    const celdas = screen.getAllByRole("button", { name: new RegExp(`^${anterior.numero} de `) });
    await usuario.click(celdas[celdas.length - 1]);

    expect(onSeleccionar).toHaveBeenCalledWith({ entrada: anterior.texto, salida: "" });
  });

  it("marca aparte las noches ocupadas que caen dentro del rango", async () => {
    const entrada = diaDelMesVisible();
    const ocupada = diaDelMesVisible(2);
    obtenerDisponibilidad.mockResolvedValue({
      productoId: 7,
      ocupadas: [{ entrada: ocupada.texto, salida: diaDelMesVisible(3).texto }],
    });

    const { container } = render(
      <CalendarioDisponibilidad
        productoId={7}
        seleccion={{ entrada: entrada.texto, salida: diaDelMesVisible(4).texto }}
        onSeleccionar={vi.fn()}
      />
    );

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalled());
    expect(container.querySelectorAll(".calendario__celda--conflicto")).toHaveLength(1);
  });

  it("muestra un mensaje de error y deja reintentar", async () => {
    obtenerDisponibilidad.mockRejectedValue(new Error("sin conexión"));

    renderizar();

    expect(await screen.findByText(/no pudimos consultar las fechas/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("al reintentar vuelve a consultar la disponibilidad", async () => {
    obtenerDisponibilidad.mockRejectedValueOnce(new Error("sin conexión"));

    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(await screen.findByRole("button", { name: /reintentar/i }));

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/no pudimos consultar/i)).not.toBeInTheDocument();
  });

  it("ofrece los campos de ingreso y egreso", async () => {
    renderizar();

    expect(await screen.findByLabelText(/ingreso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/egreso/i)).toBeInTheDocument();
  });

  it("el egreso está deshabilitado hasta que haya ingreso", async () => {
    renderizar();

    expect(await screen.findByLabelText(/egreso/i)).toBeDisabled();
  });

  it("escribir el ingreso deja la salida abierta", async () => {
    const onSeleccionar = renderizar();
    const dia = diaDelMesVisible();

    await waitFor(() => expect(obtenerDisponibilidad).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/ingreso/i), { target: { value: dia.texto } });

    expect(onSeleccionar).toHaveBeenCalledWith({ entrada: dia.texto, salida: "" });
  });

  it("con un rango elegido se pueden limpiar las fechas", async () => {
    const entrada = diaDelMesVisible();
    const usuario = userEvent.setup();
    const onSeleccionar = renderizar({
      seleccion: { entrada: entrada.texto, salida: diaDelMesVisible(4).texto },
    });

    await usuario.click(await screen.findByRole("button", { name: /limpiar fechas/i }));

    expect(onSeleccionar).toHaveBeenCalledWith({ entrada: "", salida: "" });
  });

  it("explica qué significa cada color", async () => {
    renderizar();

    expect(await screen.findByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Ocupado")).toBeInTheDocument();
    expect(screen.getByText("Tu estadía")).toBeInTheDocument();
  });
});
