import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Buscador, { normalizar, sugerenciasPara, validarBusqueda } from "./Buscador";

const CIUDADES = [
  { id: 1, nombre: "Bariloche", pais: "Argentina" },
  { id: 2, nombre: "Buenos Aires", pais: "Argentina" },
  { id: 3, nombre: "Cartagena", pais: "Colombia" },
];

describe("Validación de la búsqueda", () => {
  it("exige elegir un destino de la lista", () => {
    expect(validarBusqueda({ ciudadId: "", entrada: "", salida: "" }).destino).toMatch(/destino/i);
  });

  it("acepta una búsqueda sólo con destino", () => {
    expect(validarBusqueda({ ciudadId: "1", entrada: "", salida: "" })).toEqual({});
  });

  it("rechaza un check-out anterior o igual al check-in", () => {
    expect(
      validarBusqueda({ ciudadId: "1", entrada: "2026-10-10", salida: "2026-10-05" }).salida
    ).toMatch(/posterior/i);
    expect(
      validarBusqueda({ ciudadId: "1", entrada: "2026-10-10", salida: "2026-10-10" }).salida
    ).toMatch(/posterior/i);
  });

  it("acepta un rango de fechas coherente", () => {
    expect(validarBusqueda({ ciudadId: "1", entrada: "2026-10-10", salida: "2026-10-12" })).toEqual({});
  });

  it("pide el check-in si se cargó el check-out", () => {
    expect(validarBusqueda({ ciudadId: "1", entrada: "", salida: "2026-10-12" }).entrada).toMatch(/check-in/i);
  });
});

describe("Sugerencias de destino", () => {
  it("sin texto ofrece todos los destinos", () => {
    expect(sugerenciasPara(CIUDADES, "")).toHaveLength(3);
  });

  it("filtra por lo que se va escribiendo", () => {
    expect(sugerenciasPara(CIUDADES, "bue").map((c) => c.nombre)).toEqual(["Buenos Aires"]);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(normalizar("Bariloche")).toBe("bariloche");
    expect(sugerenciasPara([{ id: 9, nombre: "Córdoba", pais: "Argentina" }], "cordoba")).toHaveLength(1);
  });

  it("también encuentra por país", () => {
    expect(sugerenciasPara(CIUDADES, "colombia").map((c) => c.nombre)).toEqual(["Cartagena"]);
  });

  it("no devuelve nada si no hay coincidencias", () => {
    expect(sugerenciasPara(CIUDADES, "tokio")).toHaveLength(0);
  });
});

describe("Buscador", () => {
  it("muestra el título y el párrafo descriptor", () => {
    render(<Buscador ciudades={CIUDADES} onBuscar={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /buscá ofertas/i })).toBeInTheDocument();
    expect(screen.getByText(/elegí tu destino y las fechas/i)).toBeInTheDocument();
  });

  it("autocompleta mientras se escribe el destino", async () => {
    const usuario = userEvent.setup();
    render(<Buscador ciudades={CIUDADES} onBuscar={vi.fn()} />);

    await usuario.type(screen.getByLabelText(/destino/i), "car");

    const opciones = screen.getAllByRole("option");
    expect(opciones).toHaveLength(1);
    expect(opciones[0]).toHaveTextContent("Cartagena");
  });

  it("al elegir una sugerencia completa el campo y busca", async () => {
    const onBuscar = vi.fn();
    const usuario = userEvent.setup();
    render(<Buscador ciudades={CIUDADES} onBuscar={onBuscar} />);

    await usuario.type(screen.getByLabelText(/destino/i), "bari");
    await usuario.click(screen.getByRole("option", { name: /bariloche/i }));

    expect(screen.getByLabelText(/destino/i)).toHaveValue("Bariloche, Argentina");

    await usuario.click(screen.getByRole("button", { name: /realizar búsqueda/i }));

    expect(onBuscar).toHaveBeenCalledWith(
      expect.objectContaining({ ciudadId: 1, ciudad: CIUDADES[0] })
    );
  });

  it("escribir un destino sin elegirlo de la lista no busca", async () => {
    const onBuscar = vi.fn();
    const usuario = userEvent.setup();
    render(<Buscador ciudades={CIUDADES} onBuscar={onBuscar} />);

    await usuario.type(screen.getByLabelText(/destino/i), "Bariloche");
    await usuario.click(screen.getByRole("button", { name: /realizar búsqueda/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/elegí un destino/i);
    expect(onBuscar).not.toHaveBeenCalled();
  });

  it("avisa cuando no hay destinos que coincidan", async () => {
    const usuario = userEvent.setup();
    render(<Buscador ciudades={CIUDADES} onBuscar={vi.fn()} />);

    await usuario.type(screen.getByLabelText(/destino/i), "tokio");

    expect(screen.getByText(/no tenemos alojamientos en ese destino/i)).toBeInTheDocument();
  });

  it("tiene los dos campos del rango de fechas", () => {
    render(<Buscador ciudades={CIUDADES} onBuscar={vi.fn()} />);

    expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
  });
});
