import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import { ProveedorSesion } from "../context/SesionContext";
import { iniciarSesion } from "../api/auth";

vi.mock("../api/auth", () => ({
  registrarUsuario: vi.fn(),
  iniciarSesion: vi.fn(),
  obtenerPerfil: vi.fn(),
}));

const navegar = vi.fn();
vi.mock("react-router-dom", async () => {
  const real = await vi.importActual("react-router-dom");
  return { ...real, useNavigate: () => navegar };
});

function renderizarLogin() {
  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <Login />
      </ProveedorSesion>
    </MemoryRouter>
  );
}

describe("Inicio de sesión", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("pide email y contraseña antes de llamar a la API", async () => {
    const usuario = userEvent.setup();
    renderizarLogin();

    await usuario.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it("guarda el token y entra al sitio con credenciales válidas", async () => {
    iniciarSesion.mockResolvedValue({
      token: "un-token",
      usuario: { id: 1, nombre: "Ana", apellido: "Gómez", email: "ana@nexthome.com", rol: "USER", iniciales: "AG" },
    });

    const usuario = userEvent.setup();
    renderizarLogin();

    await usuario.type(screen.getByLabelText(/^email$/i), "ana@nexthome.com");
    await usuario.type(screen.getByLabelText(/^contraseña$/i), "Secreta1234");
    await usuario.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(iniciarSesion).toHaveBeenCalledWith({ email: "ana@nexthome.com", password: "Secreta1234" });
    expect(localStorage.getItem("nexthome.token")).toBe("un-token");
    expect(navegar).toHaveBeenCalledWith("/", { replace: true });
  });

  it("muestra el mensaje del backend sin revelar qué campo falló", async () => {
    iniciarSesion.mockRejectedValue({
      response: { status: 401, data: { estado: 401, mensaje: "El email o la contraseña no son correctos" } },
    });

    const usuario = userEvent.setup();
    renderizarLogin();

    await usuario.type(screen.getByLabelText(/^email$/i), "ana@nexthome.com");
    await usuario.type(screen.getByLabelText(/^contraseña$/i), "otra-cosa");
    await usuario.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText("El email o la contraseña no son correctos")).toBeInTheDocument();
    expect(localStorage.getItem("nexthome.token")).toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });
});
