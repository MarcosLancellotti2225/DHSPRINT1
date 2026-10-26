import { Link } from "react-router-dom";
import { Isotipo } from "./Logo";
import AvatarUsuario from "./AvatarUsuario";
import useSesion from "../hooks/useSesion";
import "../styles/Header.css";

/**
 * Barra superior del sitio: marca a la izquierda (enlaza al home) y accesos de
 * cuenta a la derecha. Con sesión iniciada, en lugar de los botones se muestra el
 * avatar con las iniciales del usuario. Fija arriba, según el diseño.
 *
 * El acceso al panel sólo aparece para administradores: a un visitante no le sirve
 * de nada y de paso no se anuncia dónde está.
 */
export default function Header() {
  const { autenticado, esAdministrador, cargando } = useSesion();

  return (
    <header className="nav header">
      <Link to="/" className="header__marca" aria-label="NextHome, ir al inicio">
        <Isotipo tamanio={26} />
        <span className="header__identidad">
          <span className="header__nombre">
            Next<span className="header__nombre-acento">Home</span>
          </span>
          <span className="header__lema">Tu próxima estadía, en un clic</span>
        </span>
      </Link>

      <nav className="header__acciones" aria-label="Cuenta de usuario">
        {cargando ? null : autenticado ? (
          <>
            {esAdministrador && (
              <Link to="/administracion" className="btn btn-secondary header__admin">
                Panel de administración
              </Link>
            )}
            <AvatarUsuario />
          </>
        ) : (
          <>
            <Link to="/crear-cuenta" className="btn btn-ghost">
              Crear cuenta
            </Link>
            <Link to="/ingresar" className="btn btn-primary">
              Iniciar sesión
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
