import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import FormularioProducto from "../components/FormularioProducto";
import { editarProducto, obtenerProducto } from "../api/productos";
import { erroresPorCampo, mensajeDeError } from "../api/client";
import useCatalogo from "../hooks/useCatalogo";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

export default function AdminEditarProducto() {
  useTituloPagina("Editar producto");

  const { id } = useParams();
  const navegar = useNavigate();
  const { categorias, caracteristicas } = useCatalogo();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [erroresCampo, setErroresCampo] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    obtenerProducto(id)
      .then((datos) => vigente && setProducto(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el producto")))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id]);

  async function guardar(datos) {
    setError("");
    setErroresCampo({});
    setGuardando(true);
    try {
      await editarProducto(id, datos);
      navegar("/administracion/productos");
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo guardar el producto"));
      setErroresCampo(erroresPorCampo(e));
    } finally {
      setGuardando(false);
    }
  }

  const acciones = (
    <Link to="/administracion/productos" className="btn btn-secondary">
      ← Volver al listado
    </Link>
  );

  return (
    <PanelAdmin titulo="Editar producto" acciones={acciones}>
      {error && <p className="mensaje mensaje--error">{error}</p>}

      {cargando ? (
        <p className="estado-vacio">Cargando producto…</p>
      ) : !producto ? (
        <p className="estado-vacio">No se encontró el producto que querés editar.</p>
      ) : (
        <FormularioProducto
          // Sin key el formulario mantendría el estado inicial vacío del primer render.
          key={producto.id}
          valoresIniciales={{
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            categoriaId: producto.categoria?.id ?? "",
            caracteristicaIds: producto.caracteristicas.map((caracteristica) => caracteristica.id),
          }}
          categorias={categorias}
          caracteristicas={caracteristicas}
          imagenesObligatorias={false}
          ayudaImagenes="Si no elegís ninguna, se conservan las imágenes actuales. Si elegís nuevas, reemplazan a las anteriores."
          textoBoton="Guardar cambios"
          guardando={guardando}
          erroresCampo={erroresCampo}
          onEnviar={guardar}
        />
      )}
    </PanelAdmin>
  );
}
