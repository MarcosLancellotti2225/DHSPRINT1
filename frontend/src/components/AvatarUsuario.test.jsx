import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import { ProveedorSesion } from "../context/SesionContext";
import { obtenerPerfil } from "../api/auth";

vi.mock("../api/auth", () => ({
  registrarUsuario: vi.fn(),
  iniciarSesion: vi.fn(),
  obtenerPerfil: vi.fn(),
}));

const ANA = {
  id: 1,
  nombre: "Ana",
  apellido: "Gómez",
  email: "ana@nexthome.com",
  rol: "USER",
  iniciales: "AG",
};

function renderizarHeader() {
  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <Header />
      </ProveedorSesion>
    </MemoryRouter>
  );
}

describe("Avatar y cierre de sesión", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("sin sesión muestra los accesos de cuenta", async () => {
    renderizarHeader();

    expect(await screen.findByRole("link", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(obtenerPerfil).not.toHaveBeenCalled();
  });

  it("con el token guardado revalida la sesión y muestra el nombre y las iniciales", async () => {
    localStorage.setItem("nexthome.token", "un-token");
    obtenerPerfil.mockResolvedValue(ANA);

    renderizarHeader();

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("AG")).toBeInTheDocument();
  });

  it("al desplegar el avatar aparece la opción de cerrar sesión", async () => {
    localStorage.setItem("nexthome.token", "un-token");
    obtenerPerfil.mockResolvedValue(ANA);

    const usuario = userEvent.setup();
    renderizarHeader();

    await usuario.click(await screen.findByRole("button", { name: /menú de la cuenta/i }));

    expect(screen.getByRole("menuitem", { name: /cerrar sesión/i })).toBeInTheDocument();
    expect(screen.getByText("ana@nexthome.com")).toBeInTheDocument();
  });

  it("al cerrar sesión descarta el token y vuelve a mostrar los accesos de cuenta", async () => {
    localStorage.setItem("nexthome.token", "un-token");
    obtenerPerfil.mockResolvedValue(ANA);

    const usuario = userEvent.setup();
    renderizarHeader();

    await usuario.click(await screen.findByRole("button", { name: /menú de la cuenta/i }));
    await usuario.click(screen.getByRole("menuitem", { name: /cerrar sesión/i }));

    await waitFor(() => expect(localStorage.getItem("nexthome.token")).toBeNull());
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByText("AG")).not.toBeInTheDocument();
  });

  it("si el token guardado ya no sirve, se descarta y se navega como anónimo", async () => {
    localStorage.setItem("nexthome.token", "vencido");
    obtenerPerfil.mockRejectedValue({ response: { status: 401 } });

    renderizarHeader();

    expect(await screen.findByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(localStorage.getItem("nexthome.token")).toBeNull();
  });
});
