import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminUsuarios from "./AdminUsuarios";
import { cambiarRolUsuario, listarUsuarios } from "../api/usuarios";

vi.mock("../api/usuarios", () => ({
  listarUsuarios: vi.fn(),
  cambiarRolUsuario: vi.fn(),
}));

const ADMIN = {
  id: 1, nombre: "Marcos", apellido: "Lancellotti",
  email: "admin@nexthome.com", rol: "ADMIN", iniciales: "ML",
};
const ANA = {
  id: 2, nombre: "Ana", apellido: "Gómez",
  email: "ana@nexthome.com", rol: "USER", iniciales: "AG",
};

// El usuario identificado es el administrador precargado.
vi.mock("../hooks/useSesion", () => ({
  default: () => ({
    usuario: { id: 1, nombre: "Marcos", apellido: "Lancellotti", rol: "ADMIN" },
    autenticado: true,
    esAdministrador: true,
    cargando: false,
  }),
}));

function renderizarUsuarios() {
  return render(
    <MemoryRouter>
      <AdminUsuarios />
    </MemoryRouter>
  );
}

describe("Listado de usuarios del panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra los usuarios registrados con su rol", async () => {
    listarUsuarios.mockResolvedValue([ADMIN, ANA]);
    renderizarUsuarios();

    expect(await screen.findByRole("cell", { name: "admin@nexthome.com" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "ana@nexthome.com" })).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Usuario")).toBeInTheDocument();
  });

  it("otorga permisos de administrador a otro usuario", async () => {
    listarUsuarios.mockResolvedValue([ADMIN, ANA]);
    cambiarRolUsuario.mockResolvedValue({ ...ANA, rol: "ADMIN" });

    const usuario = userEvent.setup();
    renderizarUsuarios();

    await usuario.click(await screen.findByRole("button", { name: /dar permisos de administrador/i }));

    await waitFor(() => expect(cambiarRolUsuario).toHaveBeenCalledWith(2, true));
    expect(await screen.findByText(/ana gómez ahora es administrador/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /quitar permisos/i })).toBeInTheDocument();
  });

  it("quita permisos de administrador a otro usuario", async () => {
    listarUsuarios.mockResolvedValue([ADMIN, { ...ANA, rol: "ADMIN" }]);
    cambiarRolUsuario.mockResolvedValue(ANA);

    const usuario = userEvent.setup();
    renderizarUsuarios();

    await usuario.click(await screen.findByRole("button", { name: /quitar permisos/i }));

    await waitFor(() => expect(cambiarRolUsuario).toHaveBeenCalledWith(2, false));
    expect(await screen.findByText(/ana gómez ya no es administrador/i)).toBeInTheDocument();
  });

  it("no ofrece quitarse el permiso a uno mismo", async () => {
    listarUsuarios.mockResolvedValue([ADMIN, ANA]);
    renderizarUsuarios();

    await screen.findByRole("cell", { name: "admin@nexthome.com" });

    expect(screen.getByText("Es tu propia cuenta")).toBeInTheDocument();
    // El único botón de permisos es el de la otra usuaria.
    expect(screen.getAllByRole("button", { name: /permisos/i })).toHaveLength(1);
  });

  it("avisa si el backend rechaza el cambio de rol", async () => {
    listarUsuarios.mockResolvedValue([ADMIN, ANA]);
    cambiarRolUsuario.mockRejectedValue({
      response: { status: 409, data: { estado: 409, mensaje: "No podés quitarte a vos mismo el permiso de administrador" } },
    });

    const usuario = userEvent.setup();
    renderizarUsuarios();

    await usuario.click(await screen.findByRole("button", { name: /dar permisos de administrador/i }));

    expect(await screen.findByText(/no podés quitarte a vos mismo/i)).toBeInTheDocument();
  });
});
