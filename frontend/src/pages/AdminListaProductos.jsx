import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Paginacion from "../components/Paginacion";
import { eliminarProducto, listarProductos, TAMANIO_PAGINA } from "../api/productos";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

export default function AdminListaProductos() {
  useTituloPagina("Lista de productos");

  const [pagina, setPagina] = useState(0);
  const [datosPagina, setDatosPagina] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async (numeroPagina) => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarProductos(numeroPagina, TAMANIO_PAGINA);
      // Al borrar el último ítem de una página hay que retroceder una posición.
      if (datos.contenido.length === 0 && numeroPagina > 0) {
        setPagina(numeroPagina - 1);
        return;
      }
      setDatosPagina(datos);
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cargar el listado de productos"));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(pagina);
  }, [cargar, pagina]);

  async function confirmarEliminacion() {
    setEliminando(true);
    setError("");
    try {
      await eliminarProducto(aEliminar.id);
      setAviso(`Se eliminó "${aEliminar.nombre}" del catálogo.`);
      setAEliminar(null);
      await cargar(pagina);
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo eliminar el producto"));
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const acciones = (
    <Link to="/administracion" className="btn btn-secondary">
      ← Volver al panel
    </Link>
  );

  return (
    <PanelAdmin titulo="Lista de productos" acciones={acciones}>
      {aviso && <p className="mensaje mensaje--exito">{aviso}</p>}
      {error && <p className="mensaje mensaje--error">{error}</p>}

      {cargando ? (
        <p className="estado-vacio">Cargando productos…</p>
      ) : !datosPagina || datosPagina.contenido.length === 0 ? (
        <p className="estado-vacio">Todavía no hay productos cargados.</p>
      ) : (
        <>
          <div className="admin__tabla-contenedor">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datosPagina.contenido.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.id}</td>
                    <td>{producto.nombre}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setAviso("");
                          setAEliminar(producto);
                        }}
                      >
                        Eliminar producto
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={datosPagina.pagina}
            totalPaginas={datosPagina.totalPaginas}
            onCambiarPagina={setPagina}
          />
        </>
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo="Eliminar producto"
          mensaje={`¿Confirmás que querés eliminar «${aEliminar.nombre}»? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          procesando={eliminando}
          onConfirmar={confirmarEliminacion}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </PanelAdmin>
  );
}
