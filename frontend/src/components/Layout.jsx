import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/Layout.css";

/**
 * Estructura común a todas las páginas: header fijo arriba, main que ocupa
 * todo el alto disponible y footer siempre al pie.
 */
export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
