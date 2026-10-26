import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BotonFavorito from "./BotonFavorito";
import { ProveedorFavoritos } from "../context/FavoritosContext";
import { ProveedorSesion } from "../context/SesionContext";
import { desmarcarFavorito, listarFavoritos, marcarFavorito } from "../api/favoritos";
import { obtenerPerfil } from "../api/auth";

vi.mock("../api/favoritos", () => ({
  listarFavoritos: vi.fn(),
  marcarFavorito: vi.fn(),
  desmarcarFavorito: vi.fn(),
}));
vi.mock("../api/auth", () => ({
  registrarUsuario: vi.fn(),
  iniciarSesion: vi.fn(),
  obtenerPerfil: vi.fn(),
}));

const ANA = {
  id: 1, nombre: "Ana", apellido: "Gómez",
  email: "ana@nexthome.com", rol: "USER", iniciales: "AG",
};
const HOTEL = { id: 7, nombre: "Hotel del Valle", descripcion: "…", imagenes: [] };

function renderizarBoton() {
  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <ProveedorFavoritos>
          <BotonFavorito producto={HOTEL} />
        </ProveedorFavoritos>
      </ProveedorSesion>
    </MemoryRouter>
  );
}

function conSesion() {
  localStorage.setItem("nexthome.token", "un-token");
  obtenerPerfil.mockResolvedValue(ANA);
}

describe("Botón de favorito", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    listarFavoritos.mockResolvedValue([]);
  });

  it("no se muestra sin sesión iniciada", async () => {
    renderizarBoton();

    await waitFor(() => expect(screen.queryByRole("button")).not.toBeInTheDocument());
    expect(listarFavoritos).not.toHaveBeenCalled();
  });

  it("con sesión aparece sin marcar", async () => {
    conSesion();
    renderizarBoton();

    const boton = await screen.findByRole("button", { name: /agregar .* a favoritos/i });
    expect(boton).toHaveAttribute("aria-pressed", "false");
  });

  it("marca el favorito con un solo clic", async () => {
    conSesion();
    marcarFavorito.mockResolvedValue({ productoId: HOTEL.id, favorito: true });

    const usuario = userEvent.setup();
    renderizarBoton();

    await usuario.click(await screen.findByRole("button", { name: /agregar/i }));

    await waitFor(() => expect(marcarFavorito).toHaveBeenCalledWith(HOTEL.id));
    expect(await screen.findByRole("button", { name: /quitar/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("vuelve a desmarcarlo con otro clic", async () => {
    conSesion();
    listarFavoritos.mockResolvedValue([HOTEL]);
    desmarcarFavorito.mockResolvedValue({ productoId: HOTEL.id, favorito: false });

    const usuario = userEvent.setup();
    renderizarBoton();

    await usuario.click(await screen.findByRole("button", { name: /quitar/i }));

    await waitFor(() => expect(desmarcarFavorito).toHaveBeenCalledWith(HOTEL.id));
    expect(await screen.findByRole("button", { name: /agregar/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("si el backend falla, el corazón no queda marcado", async () => {
    conSesion();
    marcarFavorito.mockRejectedValue(new Error("sin conexión"));

    const usuario = userEvent.setup();
    renderizarBoton();

    await usuario.click(await screen.findByRole("button", { name: /agregar/i }));

    await waitFor(() => expect(marcarFavorito).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: /agregar/i })).toHaveAttribute("aria-pressed", "false");
  });
});
