import { useEffect, useState } from "react";
import { listarCategorias } from "../api/categorias";
import { listarCaracteristicas } from "../api/caracteristicas";

/**
 * Categorías y características disponibles para los formularios de producto.
 * Si alguna de las dos listas falla se devuelve vacía: el formulario sigue
 * siendo usable aunque no se pueda clasificar el alojamiento.
 */
export default function useCatalogo() {
  const [categorias, setCategorias] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    Promise.all([
      listarCategorias().catch(() => []),
      listarCaracteristicas().catch(() => []),
    ])
      .then(([lasCategorias, lasCaracteristicas]) => {
        if (!vigente) return;
        setCategorias(lasCategorias);
        setCaracteristicas(lasCaracteristicas);
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  return { categorias, caracteristicas, cargando };
}
