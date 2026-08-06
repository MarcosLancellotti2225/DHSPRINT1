import { Link } from "react-router-dom";
import { Isotipo } from "./Logo";
import "../styles/Footer.css";

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__marca">
        <Isotipo tamanio={18} />
        <span>&copy; {anio} NextHome. Todos los derechos reservados.</span>
      </div>

      <Link to="/administracion" className="footer__enlace">
        Panel de administración
      </Link>
    </footer>
  );
}
