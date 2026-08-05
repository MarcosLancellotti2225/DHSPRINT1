import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // El 5173 (default de Vite) se deja libre para otro proyecto.
    port: 5174,
  },
});
