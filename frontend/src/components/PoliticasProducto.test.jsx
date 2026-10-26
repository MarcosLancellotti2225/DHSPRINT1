import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PoliticasProducto from "./PoliticasProducto";
import { listarPoliticas } from "../api/politicas";

vi.mock("../api/politicas", () => ({ listarPoliticas: vi.fn() }));

const POLITICAS = [
  { id: 1, titulo: "Normas de la casa", descripcion: "El check-in es de 14 a 22." },
  { id: 2, titulo: "Salud y seguridad", descripcion: "Matafuegos y detector de humo." },
  { id: 3, titulo: "Política de cancelación", descripcion: "Sin costo hasta 48 horas antes." },
];

describe("Bloque de políticas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el título del bloque y cada política con su descripción", async () => {
    listarPoliticas.mockResolvedValue(POLITICAS);

    render(<PoliticasProducto />);

    expect(await screen.findByRole("heading", { name: /qué tenés que saber/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Normas de la casa" })).toBeInTheDocument();
    expect(screen.getByText("El check-in es de 14 a 22.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("el título del bloque va subrayado", async () => {
    listarPoliticas.mockResolvedValue(POLITICAS);

    render(<PoliticasProducto />);

    const titulo = await screen.findByRole("heading", { name: /qué tenés que saber/i });
    expect(titulo).toHaveClass("politicas__titulo");
  });

  it("no muestra nada si la API falla", async () => {
    listarPoliticas.mockRejectedValue(new Error("sin conexión"));

    const { container } = render(<PoliticasProducto />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("no muestra nada si todavía no hay políticas cargadas", async () => {
    listarPoliticas.mockResolvedValue([]);

    const { container } = render(<PoliticasProducto />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
