import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Favoritos from "./Favoritos";
import { ProveedorFavoritos } from "../context/FavoritosContext";
import { ProveedorSesion } from "../context/SesionContext";
import { desmarcarFavorito, listarFavoritos } from "../api/favoritos";
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

function producto(id, nombre) {
  return { id, nombre, descripcion: `Descripción de ${nombre}`, imagenes: [] };
}

function renderizarFavoritos() {
  localStorage.setItem("nexthome.token", "un-token");
  obtenerPerfil.mockResolvedValue(ANA);

  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <ProveedorFavoritos>
          <Favoritos />
        </ProveedorFavoritos>
      </ProveedorSesion>
    </MemoryRouter>
  );
}

describe("Lista de favoritos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("muestra los productos marcados", async () => {
    listarFavoritos.mockResolvedValue([producto(7, "Hotel del Valle"), producto(8, "Cabaña del Lago")]);

    renderizarFavoritos();

    expect(await screen.findByText("Hotel del Valle")).toBeInTheDocument();
    expect(screen.getByText("Cabaña del Lago")).toBeInTheDocument();
    expect(screen.getByText("2 alojamientos guardados")).toBeInTheDocument();
  });

  it("concuerda el singular con un solo favorito", async () => {
    listarFavoritos.mockResolvedValue([producto(7, "Hotel del Valle")]);

    renderizarFavoritos();

    expect(await screen.findByText("1 alojamiento guardado")).toBeInTheDocument();
  });

  it("invita a marcar alguno cuando la lista está vacía", async () => {
    listarFavoritos.mockResolvedValue([]);

    renderizarFavoritos();

    expect(await screen.findByText(/todavía no marcaste ningún alojamiento/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver alojamientos/i })).toBeInTheDocument();
  });

  it("al quitar un favorito desaparece de la lista en el momento", async () => {
    listarFavoritos.mockResolvedValue([producto(7, "Hotel del Valle"), producto(8, "Cabaña del Lago")]);
    desmarcarFavorito.mockResolvedValue({ productoId: 7, favorito: false });

    const usuario = userEvent.setup();
    renderizarFavoritos();

    await usuario.click(await screen.findByRole("button", { name: /quitar hotel del valle/i }));

    await waitFor(() => expect(desmarcarFavorito).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.queryByText("Hotel del Valle")).not.toBeInTheDocument());
    expect(screen.getByText("Cabaña del Lago")).toBeInTheDocument();
    expect(screen.getByText("1 alojamiento guardado")).toBeInTheDocument();
  });
});
