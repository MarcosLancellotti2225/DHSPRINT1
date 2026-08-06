import { Link } from "react-router-dom";
import { Isotipo } from "./Logo";
import "../styles/Header.css";

/**
 * Barra superior del sitio público: marca a la izquierda (enlaza al home) y
 * accesos de cuenta a la derecha. Fija arriba, según el diseño.
 */
export default function Header() {
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
        <button type="button" className="btn btn-ghost">
          Crear cuenta
        </button>
        <button type="button" className="btn btn-primary">
          Iniciar sesión
        </button>
      </nav>
    </header>
  );
}
