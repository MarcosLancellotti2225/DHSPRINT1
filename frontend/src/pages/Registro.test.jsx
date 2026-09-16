import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Registro from "./Registro";
import { ProveedorSesion } from "../context/SesionContext";
import { registrarUsuario } from "../api/auth";

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

function renderizarRegistro() {
  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <Registro />
      </ProveedorSesion>
    </MemoryRouter>
  );
}

async function completar(usuario, { email = "marcos@nexthome.com", password = "Secreta1234" } = {}) {
  await usuario.type(screen.getByLabelText(/^nombre$/i), "Marcos");
  await usuario.type(screen.getByLabelText(/^apellido$/i), "Lancellotti");
  if (email) await usuario.type(screen.getByLabelText(/^email$/i), email);
  if (password) await usuario.type(screen.getByLabelText(/^contraseña$/i), password);
}

describe("Registro de usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("pide todos los campos obligatorios y no llama a la API", async () => {
    const usuario = userEvent.setup();
    renderizarRegistro();

    await usuario.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El apellido es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it("rechaza un email con formato inválido", async () => {
    const usuario = userEvent.setup();
    renderizarRegistro();

    await completar(usuario, { email: "esto-no-es-un-email" });
    await usuario.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText("El email no tiene un formato válido")).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it("rechaza una contraseña más corta que el mínimo", async () => {
    const usuario = userEvent.setup();
    renderizarRegistro();

    await completar(usuario, { password: "corta" });
    await usuario.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it("no pierde lo ya cargado al mostrar los errores", async () => {
    const usuario = userEvent.setup();
    renderizarRegistro();

    await completar(usuario, { email: "sin-arroba", password: "corta" });
    await usuario.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Marcos");
    expect(screen.getByLabelText(/^apellido$/i)).toHaveValue("Lancellotti");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("sin-arroba");
  });

  it("registra al usuario, guarda el token y vuelve al home", async () => {
    registrarUsuario.mockResolvedValue({
      token: "un-token",
      usuario: { id: 1, nombre: "Marcos", apellido: "Lancellotti", email: "marcos@nexthome.com", rol: "USER", iniciales: "ML" },
    });

    const usuario = userEvent.setup();
    renderizarRegistro();

    await completar(usuario);
    await usuario.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(registrarUsuario).toHaveBeenCalledWith({
      nombre: "Marcos",
      apellido: "Lancellotti",
      email: "marcos@nexthome.com",
      password: "Secreta1234",
    });
    expect(localStorage.getItem("nexthome.token")).toBe("un-token");
    expect(navegar).toHaveBeenCalledWith("/");
  });

  it("avisa explícitamente si el email ya está registrado", async () => {
    registrarUsuario.mockRejectedValue({
      response: {
        status: 409,
        data: { estado: 409, mensaje: "Ya existe una cuenta registrada con el email marcos@nexthome.com" },
      },
    });

    const usuario = userEvent.setup();
    renderizarRegistro();

    await completar(usuario);
    await usuario.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findAllByText(/ya existe una cuenta registrada/i)).not.toHaveLength(0);
    expect(navegar).not.toHaveBeenCalled();
  });
});
