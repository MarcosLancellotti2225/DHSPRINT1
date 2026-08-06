import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/Layout.css";

/**
 * Estructura común del sitio: header fijo arriba, main que ocupa todo el alto
 * disponible y footer al pie.
 *
 * Las pantallas de administración traen su propia barra, así que ahí no se
 * monta la del sitio público (ni el footer).
 */
export default function Layout() {
  const { pathname } = useLocation();
  const esAdministracion = pathname.startsWith("/administracion");

  return (
    <div className="layout">
      {!esAdministracion && <Header />}
      <main className="layout__main">
        <Outlet />
      </main>
      {!esAdministracion && <Footer />}
    </div>
  );
}
