import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ImagenProducto from "./ImagenProducto";

describe("ImagenProducto", () => {
  it("muestra la imagen apuntando al backend", () => {
    render(<ImagenProducto url="/uploads/foto.png" alt="Hotel del Valle" />);

    const imagen = screen.getByRole("img", { name: "Hotel del Valle" });
    expect(imagen.tagName).toBe("IMG");
    expect(imagen).toHaveAttribute("src", expect.stringContaining("/uploads/foto.png"));
  });

  it("muestra el respaldo si el producto no tiene imagen", () => {
    render(<ImagenProducto url={null} alt="Hotel sin fotos" />);

    expect(screen.getByRole("img", { name: /imagen no disponible/i })).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("cambia al respaldo si el archivo no se puede cargar", () => {
    render(<ImagenProducto url="/uploads/borrada.png" alt="Hotel del Valle" />);

    const imagen = screen.getByRole("img", { name: "Hotel del Valle" });
    fireEvent.error(imagen);

    expect(screen.getByRole("img", { name: /imagen no disponible/i })).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("respeta el loading que le pasen", () => {
    render(<ImagenProducto url="/uploads/foto.png" alt="Hotel del Valle" loading="lazy" />);

    expect(screen.getByRole("img", { name: "Hotel del Valle" })).toHaveAttribute("loading", "lazy");
  });
});
