import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import DetalleProducto from "./pages/DetalleProducto";
import Administracion from "./pages/Administracion";
import AdminListaProductos from "./pages/AdminListaProductos";
import AdminNuevoProducto from "./pages/AdminNuevoProducto";
import NoEncontrada from "./pages/NoEncontrada";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/administracion" element={<Administracion />} />
          <Route path="/administracion/productos" element={<AdminListaProductos />} />
          <Route path="/administracion/productos/nuevo" element={<AdminNuevoProducto />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
