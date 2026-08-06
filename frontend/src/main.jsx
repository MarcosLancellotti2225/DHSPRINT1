import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// El sistema de diseño va primero: así los estilos de cada componente,
// que se importan dentro de App, pueden ajustarlo sin pelear por especificidad.
import "./styles/index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
