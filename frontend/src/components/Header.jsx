import { Link } from "react-router-dom";
import "../styles/Header.css";

/**
 * Encabezado fijo, presente en todas las páginas.
 * El logo y el lema son un único enlace al home.
 */
export default function Header() {
  return (
    <header className="header">
      <div className="header__contenido">
        <Link to="/" className="header__marca" aria-label="Db, ir al inicio">
          <span className="header__logo" aria-hidden="true">
            Db
          </span>
          <span className="header__lema">Reservá tu próxima estadía</span>
        </Link>

        <nav className="header__acciones" aria-label="Cuenta de usuario">
          <button type="button" className="boton boton--contorno header__boton">
            Crear cuenta
          </button>
          <button type="button" className="boton boton--acento header__boton">
            Iniciar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
