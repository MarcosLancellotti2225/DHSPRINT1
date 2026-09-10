import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProveedorSesion } from "./context/SesionContext";
import Layout from "./components/Layout";
import RutaProtegida from "./components/RutaProtegida";
import Home from "./pages/Home";
import DetalleProducto from "./pages/DetalleProducto";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Administracion from "./pages/Administracion";
import AdminListaProductos from "./pages/AdminListaProductos";
import AdminNuevoProducto from "./pages/AdminNuevoProducto";
import AdminEditarProducto from "./pages/AdminEditarProducto";
import AdminCategorias from "./pages/AdminCategorias";
import AdminCaracteristicas from "./pages/AdminCaracteristicas";
import AdminUsuarios from "./pages/AdminUsuarios";
import NoEncontrada from "./pages/NoEncontrada";

export default function App() {
  return (
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/producto/:id" element={<DetalleProducto />} />
            <Route path="/crear-cuenta" element={<Registro />} />
            <Route path="/ingresar" element={<Login />} />

            {/* El panel es sólo para administradores. El backend valida el rol en
                cada endpoint: esto es comodidad de navegación, no la seguridad. */}
            <Route element={<RutaProtegida soloAdministrador />}>
              <Route path="/administracion" element={<Administracion />} />
              <Route path="/administracion/productos" element={<AdminListaProductos />} />
              <Route path="/administracion/productos/nuevo" element={<AdminNuevoProducto />} />
              <Route path="/administracion/productos/:id/editar" element={<AdminEditarProducto />} />
              <Route path="/administracion/categorias" element={<AdminCategorias />} />
              <Route path="/administracion/caracteristicas" element={<AdminCaracteristicas />} />
              <Route path="/administracion/usuarios" element={<AdminUsuarios />} />
            </Route>

            <Route path="*" element={<NoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  );
}
