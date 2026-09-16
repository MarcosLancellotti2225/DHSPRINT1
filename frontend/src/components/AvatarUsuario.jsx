import { useEffect, useRef, useState } from "react";
import useSesion from "../hooks/useSesion";
import "../styles/AvatarUsuario.css";

/**
 * Avatar de letras con las iniciales del usuario. Al desplegarlo aparece, debajo,
 * la opción de cerrar sesión.
 */
export default function AvatarUsuario() {
  const { usuario, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // Se cierra al hacer clic afuera o con Escape, como cualquier menú del sistema.
  useEffect(() => {
    if (!abierto) return undefined;

    function alClickAfuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) {
        setAbierto(false);
      }
    }
    function alPresionarTecla(evento) {
      if (evento.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", alClickAfuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alClickAfuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  if (!usuario) return null;

  return (
    <div className="avatar" ref={contenedorRef}>
      <button
        type="button"
        className="avatar__disparador"
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        aria-haspopup="menu"
      >
        <span className="avatar__saludo">
          Hola,
          <strong className="avatar__nombre"> {usuario.nombre}</strong>
        </span>
        <span className="avatar__iniciales" aria-hidden="true">
          {usuario.iniciales}
        </span>
        <span className="sr-only">Abrir menú de la cuenta</span>
      </button>

      {abierto && (
        <div className="card elev-md avatar__menu" role="menu">
          <div className="avatar__identidad">
            <span className="avatar__completo">
              {usuario.nombre} {usuario.apellido}
            </span>
            <span className="avatar__email">{usuario.email}</span>
            {usuario.rol === "ADMIN" && <span className="tag tag-outline avatar__rol">Administrador</span>}
          </div>

          <button
            type="button"
            className="btn btn-secondary avatar__salir"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              salir();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
