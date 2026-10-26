import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { desmarcarFavorito, listarFavoritos, marcarFavorito } from "../api/favoritos";
import useSesion from "../hooks/useSesion";

export const FavoritosContext = createContext(null);

/**
 * Favoritos del usuario identificado, compartidos por toda la aplicación.
 *
 * Viven acá y no en cada pantalla para que marcar un corazón en el home se refleje
 * al instante en la lista de favoritos, que es lo que pide la historia. Al cerrar
 * sesión se vacían: son de la cuenta, no del navegador.
 */
export function ProveedorFavoritos({ children }) {
  const { autenticado } = useSesion();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!autenticado) {
      setProductos([]);
      return undefined;
    }

    let vigente = true;
    setCargando(true);

    listarFavoritos()
      .then((datos) => vigente && setProductos(datos))
      .catch(() => vigente && setProductos([]))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [autenticado]);

  const esFavorito = useCallback(
    (productoId) => productos.some((producto) => producto.id === productoId),
    [productos]
  );

  /**
   * Marca o desmarca. El estado se actualiza apenas responde el backend, así la
   * lista y los corazones nunca muestran algo que el servidor no confirmó.
   */
  const alternar = useCallback(
    async (producto) => {
      setError("");
      const estaba = productos.some((otro) => otro.id === producto.id);

      try {
        if (estaba) {
          await desmarcarFavorito(producto.id);
          setProductos((previos) => previos.filter((otro) => otro.id !== producto.id));
        } else {
          await marcarFavorito(producto.id);
          setProductos((previos) => [producto, ...previos]);
        }
      } catch {
        setError("No se pudo actualizar tus favoritos. Probá de nuevo en un momento.");
      }
    },
    [productos]
  );

  const valor = useMemo(
    () => ({ productos, cargando, error, esFavorito, alternar, cantidad: productos.length }),
    [productos, cargando, error, esFavorito, alternar]
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}
