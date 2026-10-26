import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ValoracionesProducto from "./ValoracionesProducto";
import { ProveedorSesion } from "../context/SesionContext";
import { listarValoraciones, valorarProducto } from "../api/valoraciones";
import { obtenerPerfil } from "../api/auth";

vi.mock("../api/valoraciones", () => ({
  listarValoraciones: vi.fn(),
  valorarProducto: vi.fn(),
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

const RESENIA = {
  id: 1,
  estrellas: 5,
  comentario: "Impecable, volvería.",
  autor: "Ana Gómez",
  publicadaEn: "2026-10-20T12:00:00Z",
};

function respuesta(extra = {}) {
  return {
    promedio: 0,
    cantidad: 0,
    puedePuntuar: false,
    miValoracion: null,
    resenias: [],
    ...extra,
  };
}

function renderizar({ conSesion = false } = {}) {
  if (conSesion) {
    localStorage.setItem("nexthome.token", "un-token");
    obtenerPerfil.mockResolvedValue(ANA);
  }
  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <ValoracionesProducto productoId={7} />
      </ProveedorSesion>
    </MemoryRouter>
  );
}

describe("Opiniones del alojamiento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    listarValoraciones.mockResolvedValue(respuesta());
  });

  it("muestra el promedio y la cantidad de opiniones", async () => {
    listarValoraciones.mockResolvedValue(
      respuesta({ promedio: 4.5, cantidad: 2, resenias: [RESENIA] })
    );

    renderizar();

    expect(await screen.findByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("2 opiniones")).toBeInTheDocument();
  });

  it("cada reseña muestra estrellas, autor, fecha y comentario", async () => {
    listarValoraciones.mockResolvedValue(
      respuesta({ promedio: 5, cantidad: 1, resenias: [RESENIA] })
    );

    renderizar();

    expect(await screen.findByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("Impecable, volvería.")).toBeInTheDocument();
    expect(screen.getByText(/20 de octubre de 2026/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "5 de 5 estrellas" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /^promedio de/i })).toBeInTheDocument();
  });

  it("avisa cuando todavía nadie opinó", async () => {
    renderizar();

    expect(await screen.findByText(/todavía nadie opinó/i)).toBeInTheDocument();
  });

  it("sin haberse hospedado no ofrece el formulario", async () => {
    listarValoraciones.mockResolvedValue(respuesta({ puedePuntuar: false }));

    renderizar({ conSesion: true });

    await screen.findByText(/todavía nadie opinó/i);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("a quien se hospedó le ofrece puntuar", async () => {
    listarValoraciones.mockResolvedValue(respuesta({ puedePuntuar: true }));

    renderizar({ conSesion: true });

    expect(await screen.findByText(/te alojaste acá/i)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("publica la opinión con las estrellas y el comentario", async () => {
    listarValoraciones.mockResolvedValue(respuesta({ puedePuntuar: true }));
    valorarProducto.mockResolvedValue({ id: 1, estrellas: 5 });

    const usuario = userEvent.setup();
    renderizar({ conSesion: true });

    await usuario.click(await screen.findByRole("radio", { name: "5 estrellas" }));
    await usuario.type(screen.getByLabelText(/tu comentario/i), "Muy recomendable");
    await usuario.click(screen.getByRole("button", { name: /publicar opinión/i }));

    await waitFor(() =>
      expect(valorarProducto).toHaveBeenCalledWith(7, {
        estrellas: 5,
        comentario: "Muy recomendable",
      })
    );
    expect(await screen.findByText(/gracias por tu opinión/i)).toBeInTheDocument();
  });

  it("no publica si no se eligió ninguna estrella", async () => {
    listarValoraciones.mockResolvedValue(respuesta({ puedePuntuar: true }));

    const usuario = userEvent.setup();
    renderizar({ conSesion: true });

    await usuario.click(await screen.findByRole("button", { name: /publicar opinión/i }));

    expect(await screen.findByText(/elegí cuántas estrellas/i)).toBeInTheDocument();
    expect(valorarProducto).not.toHaveBeenCalled();
  });

  it("si ya había puntuado, el formulario arranca con su opinión", async () => {
    listarValoraciones.mockResolvedValue(
      respuesta({
        puedePuntuar: true,
        promedio: 3,
        cantidad: 1,
        miValoracion: { ...RESENIA, estrellas: 3, comentario: "Correcto." },
        resenias: [{ ...RESENIA, estrellas: 3, comentario: "Correcto." }],
      })
    );

    renderizar({ conSesion: true });

    expect(await screen.findByText("Tu opinión")).toBeInTheDocument();
    expect(screen.getByLabelText(/tu comentario/i)).toHaveValue("Correcto.");
    expect(screen.getByRole("button", { name: /actualizar opinión/i })).toBeInTheDocument();
  });

  it("avisa si el backend rechaza la publicación", async () => {
    listarValoraciones.mockResolvedValue(respuesta({ puedePuntuar: true }));
    valorarProducto.mockRejectedValue({
      response: { status: 403, data: { mensaje: "Sólo podés puntuar un alojamiento en el que ya te hayas hospedado" } },
    });

    const usuario = userEvent.setup();
    renderizar({ conSesion: true });

    await usuario.click(await screen.findByRole("radio", { name: "4 estrellas" }));
    await usuario.click(screen.getByRole("button", { name: /publicar opinión/i }));

    expect(await screen.findByText(/ya te hayas hospedado/i)).toBeInTheDocument();
  });

  it("avisa si no se pueden cargar las opiniones", async () => {
    listarValoraciones.mockRejectedValue(new Error("sin conexión"));

    renderizar();

    expect(await screen.findByText(/no pudimos cargar las opiniones/i)).toBeInTheDocument();
  });
});
