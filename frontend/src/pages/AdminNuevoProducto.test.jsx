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

vi.mock("../api/ciudades", () => ({
  listarCiudades: vi.fn().mockResolvedValue([{ id: 1, nombre: "Bariloche", pais: "Argentina" }]),
}));
vi.mock("../api/categorias", () => ({
  listarCategorias: vi.fn().mockResolvedValue([
    { id: 7, titulo: "Cabañas", descripcion: "En el bosque.", imagen: "/uploads/c.png" },
  ]),
}));
vi.mock("../api/caracteristicas", () => ({ listarCaracteristicas: vi.fn().mockResolvedValue([]) }));

const CIUDAD = { id: 1, nombre: "Bariloche", pais: "Argentina" };
const CATEGORIA = { id: 7, titulo: "Cabañas" };

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
  await usuario.type(screen.getByLabelText(/^nombre$/i), "Hotel del Valle");
  await usuario.type(
    screen.getByLabelText(/descripción/i),
    "Un hotel de montaña con vista despejada al valle."
  );
  await usuario.type(screen.getByLabelText(/precio por noche/i), "85000");
  // Ciudad y categoría son obligatorias: sin ellas el alojamiento no se busca ni se filtra.
  await usuario.selectOptions(screen.getByLabelText(/ciudad/i), String(CIUDAD.id));
  await usuario.selectOptions(screen.getByLabelText(/categoría/i), String(CATEGORIA.id));
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

    const aviso = await screen.findByText(/al menos una imagen/i);
    expect(aviso).toBeInTheDocument();
    expect(screen.getByLabelText(/imágenes/i)).toHaveAttribute("aria-invalid", "true");
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
        descripcion: "Un hotel de montaña con vista despejada al valle.",
        ciudadId: String(CIUDAD.id),
        categoriaId: String(CATEGORIA.id),
        capacidad: 2,
        precioPorNoche: 85000,
        imagenes: expect.arrayContaining([expect.any(File)]),
      })
    );
    expect(navegar).toHaveBeenCalledWith("/administracion/productos");
  });

  it("exige un precio por noche mayor a cero", async () => {
    const usuario = userEvent.setup();
    renderizarFormulario();

    await usuario.type(screen.getByLabelText(/^nombre$/i), "Hotel del Valle");
    await usuario.type(
      screen.getByLabelText(/descripción/i),
      "Un hotel de montaña con vista despejada al valle."
    );
    await usuario.type(screen.getByLabelText(/precio por noche/i), "0");
    await usuario.selectOptions(screen.getByLabelText(/ciudad/i), String(CIUDAD.id));
    await usuario.selectOptions(screen.getByLabelText(/categoría/i), String(CATEGORIA.id));
    await usuario.upload(screen.getByLabelText(/imágenes/i), imagenFalsa());
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(await screen.findByText(/el precio por noche tiene que ser mayor a cero/i))
      .toBeInTheDocument();
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("exige ciudad y categoría antes de llamar a la API", async () => {
    const usuario = userEvent.setup();
    renderizarFormulario();

    await usuario.type(screen.getByLabelText(/^nombre$/i), "Hotel del Valle");
    await usuario.type(
      screen.getByLabelText(/descripción/i),
      "Un hotel de montaña con vista despejada al valle."
    );
    await usuario.upload(screen.getByLabelText(/imágenes/i), imagenFalsa());
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(await screen.findByText(/elegí la ciudad/i)).toBeInTheDocument();
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("rechaza un nombre demasiado corto y lleva el foco al campo", async () => {
    const usuario = userEvent.setup();
    renderizarFormulario();

    await usuario.type(screen.getByLabelText(/^nombre$/i), "Hol");
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    const campo = screen.getByLabelText(/^nombre$/i);
    expect(await screen.findByText(/al menos 5 caracteres/i)).toBeInTheDocument();
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveFocus();
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("rechaza una descripción demasiado corta", async () => {
    const usuario = userEvent.setup();
    renderizarFormulario();

    await usuario.type(screen.getByLabelText(/^nombre$/i), "Hotel del Valle");
    await usuario.type(screen.getByLabelText(/descripción/i), "Corta");
    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));

    expect(await screen.findByText(/al menos 20 caracteres/i)).toBeInTheDocument();
    expect(crearProducto).not.toHaveBeenCalled();
  });

  it("el error del campo desaparece al corregirlo", async () => {
    const usuario = userEvent.setup();
    renderizarFormulario();

    await usuario.click(screen.getByRole("button", { name: /guardar producto/i }));
    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/^nombre$/i), "Hotel del Valle");
    expect(screen.queryByText("El nombre es obligatorio")).not.toBeInTheDocument();
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
