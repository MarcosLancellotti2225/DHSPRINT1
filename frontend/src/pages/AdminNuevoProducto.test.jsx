import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminNuevoProducto from "./AdminNuevoProducto";
import { crearProducto } from "../api/productos";

vi.mock("../api/productos", async () => {
  const real = await vi.importActual("../api/productos");
  return { ...real, crearProducto: vi.fn() };
});

const navegar = vi.fn();
vi.mock("react-router-dom", async () => {
  const real = await vi.importActual("react-router-dom");
  return { ...real, useNavigate: () => navegar };
});

function renderizarFormulario() {
  return render(
    <MemoryRouter>
      <AdminNuevoProducto />
    </MemoryRouter>
  );
}

function imagenFalsa(nombre = "foto.png") {
  return new File(["contenido"], nombre, { type: "image/png" });
}

async function completarFormulario(usuario, { conImagen = true } = {}) {
  await usuario.type(screen.getByLabelText(/nombre del alojamiento/i), "Hotel del Valle");
  await usuario.type(screen.getByLabelText(/descripción/i), "Un hotel con vista al valle.");
  if (conImagen) {
    await usuario.upload(screen.getByLabelText(/imágenes/i), imagenFalsa());
  }
}

describe("Alta de producto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el error del backend cuando el nombre ya está en uso", async () => {
    // Así responde el backend ante un nombre duplicado.
    crearProducto.mockRejectedValue({
      response: {
        status: 409,
        data: { estado: 409, mensaje: 'El nombre "Hotel del Valle" ya está en uso por otro producto' },
      },
    });

    const usuario = userEvent.setup();
    renderizarFormulario();
    await completarFormulario(usuario);
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(await screen.findByText(/ya está en uso por otro producto/i)).toBeInTheDocument();
    expect(navegar).not.toHaveBeenCalled();
  });

  it("no llama a la API si no se cargó ninguna imagen", async () => {
    const usuario = userEvent.setup();
    renderizarFormulario();
    await completarFormulario(usuario, { conImagen: false });
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(await screen.findByText(/al menos una imagen/i)).toBeInTheDocument();
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("manda nombre, descripción e imágenes y vuelve al listado si sale bien", async () => {
    crearProducto.mockResolvedValue({ id: 1, nombre: "Hotel del Valle" });

    const usuario = userEvent.setup();
    renderizarFormulario();
    await completarFormulario(usuario);
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(crearProducto).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Hotel del Valle",
        descripcion: "Un hotel con vista al valle.",
        imagenes: expect.arrayContaining([expect.any(File)]),
      })
    );
    expect(navegar).toHaveBeenCalledWith("/administracion/productos");
  });

  it("muestra los errores por campo que devuelve el backend", async () => {
    crearProducto.mockRejectedValue({
      response: {
        status: 400,
        data: {
          estado: 400,
          mensaje: "Hay datos inválidos en el formulario",
          errores: { nombre: "El nombre es obligatorio" },
        },
      },
    });

    const usuario = userEvent.setup();
    renderizarFormulario();
    await completarFormulario(usuario);
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();
  });
});
