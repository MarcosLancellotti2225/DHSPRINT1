import { Link } from "react-router-dom";
import { Isotipo } from "./Logo";
import useSesion from "../hooks/useSesion";
import "../styles/Footer.css";

export default function Footer() {
  const { esAdministrador } = useSesion();
  const anio = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__marca">
        <Isotipo tamanio={18} />
        <span>&copy; {anio} NextHome. Todos los derechos reservados.</span>
      </div>

      {/* El acceso al panel sólo se ofrece a quien puede entrar. */}
      {esAdministrador && (
        <Link to="/administracion" className="footer__enlace">
          Panel de administración
        </Link>
      )}
    </footer>
  );
}
