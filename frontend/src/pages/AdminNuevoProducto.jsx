import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import FormularioProducto from "../components/FormularioProducto";
import { crearProducto } from "../api/productos";
import { erroresPorCampo, mensajeDeError } from "../api/client";
import useCatalogo from "../hooks/useCatalogo";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

export default function AdminNuevoProducto() {
  useTituloPagina("Agregar producto");

  const navegar = useNavigate();
  const { categorias, caracteristicas } = useCatalogo();

  const [error, setError] = useState("");
  const [erroresCampo, setErroresCampo] = useState({});
  const [guardando, setGuardando] = useState(false);

  async function guardar(datos) {
    setError("");
    setErroresCampo({});
    setGuardando(true);
    try {
      await crearProducto(datos);
      navegar("/administracion/productos");
    } catch (e) {
      // El backend responde 409 si el nombre ya está en uso y 400 con el detalle por campo.
      setError(mensajeDeError(e, "No se pudo guardar el producto"));
      setErroresCampo(erroresPorCampo(e));
    } finally {
      setGuardando(false);
    }
  }

  const acciones = (
    <Link to="/administracion" className="btn btn-secondary">
      ← Volver al panel
    </Link>
  );

  return (
    <PanelAdmin titulo="Agregar producto" acciones={acciones}>
      {error && <p className="mensaje mensaje--error">{error}</p>}

      <FormularioProducto
        categorias={categorias}
        caracteristicas={caracteristicas}
        guardando={guardando}
        erroresCampo={erroresCampo}
        onEnviar={guardar}
      />
    </PanelAdmin>
  );
}
