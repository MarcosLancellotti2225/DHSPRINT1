import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BotonWhatsApp from "./BotonWhatsApp";
import "../styles/Layout.css";

/**
 * Estructura común a todas las páginas: header fijo arriba, main que ocupa el
 * alto disponible y footer al pie. El header y el footer están presentes en
 * todas las rutas, incluidas las de administración.
 *
 * El contacto por WhatsApp flota sobre todas: una consulta puede surgir en
 * cualquier página y no requiere tener la sesión iniciada.
 */
export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
      <BotonWhatsApp />
    </div>
  );
}
