import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PanelAdmin from "../components/PanelAdmin";
import { cambiarRolUsuario, listarUsuarios } from "../api/usuarios";
import { mensajeDeError } from "../api/client";
import useSesion from "../hooks/useSesion";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/Admin.css";

export default function AdminUsuarios() {
  useTituloPagina("Usuarios registrados");

  const { usuario: propio } = useSesion();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enProceso, setEnProceso] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setUsuarios(await listarUsuarios());
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cargar el listado de usuarios"));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarPermiso(usuario) {
    const otorgar = usuario.rol !== "ADMIN";
    setEnProceso(usuario.id);
    setError("");
    setAviso("");
    try {
      const actualizado = await cambiarRolUsuario(usuario.id, otorgar);
      setUsuarios((previos) =>
        previos.map((otro) => (otro.id === actualizado.id ? actualizado : otro))
      );
      setAviso(
        otorgar
          ? `${actualizado.nombre} ${actualizado.apellido} ahora es administrador.`
          : `${actualizado.nombre} ${actualizado.apellido} ya no es administrador.`
      );
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cambiar el permiso del usuario"));
    } finally {
      setEnProceso(null);
    }
  }

  const acciones = (
    <Link to="/administracion" className="btn btn-secondary">
      ← Volver al panel
    </Link>
  );

  return (
    <PanelAdmin titulo="Usuarios registrados" acciones={acciones}>
      {aviso && <p className="mensaje mensaje--exito">{aviso}</p>}
      {error && <p className="mensaje mensaje--error">{error}</p>}

      {cargando ? (
        <p className="estado-vacio">Cargando usuarios…</p>
      ) : usuarios.length === 0 ? (
        <p className="estado-vacio">Todavía no hay usuarios registrados.</p>
      ) : (
        <div className="admin__tabla-contenedor">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Nombre</th>
                <th scope="col">Email</th>
                <th scope="col">Rol</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const esAdministrador = usuario.rol === "ADMIN";
                const esUnoMismo = usuario.id === propio?.id;

                return (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>
                      {usuario.nombre} {usuario.apellido}
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={`tag ${esAdministrador ? "tag-accent" : "tag-neutral"}`}>
                        {esAdministrador ? "Administrador" : "Usuario"}
                      </span>
                    </td>
                    <td>
                      {/* Nadie puede quitarse a sí mismo el permiso: el backend lo
                          rechaza igual, acá sólo se evita el intento. */}
                      {esAdministrador && esUnoMismo ? (
                        <span className="admin__ayuda">Es tu propia cuenta</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={enProceso === usuario.id}
                          onClick={() => alternarPermiso(usuario)}
                        >
                          {esAdministrador ? "Quitar permisos" : "Dar permisos de administrador"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PanelAdmin>
  );
}
