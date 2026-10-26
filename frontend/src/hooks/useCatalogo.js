import { useEffect, useState } from "react";
import { listarCategorias } from "../api/categorias";
import { listarCaracteristicas } from "../api/caracteristicas";
import { listarCiudades } from "../api/ciudades";

/**
 * Ciudades, categorías y características disponibles para los formularios de
 * producto. Si alguna lista falla se devuelve vacía: el formulario sigue siendo
 * usable aunque no se pueda clasificar el alojamiento.
 */
export default function useCatalogo() {
  const [ciudades, setCiudades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    Promise.all([
      listarCiudades().catch(() => []),
      listarCategorias().catch(() => []),
      listarCaracteristicas().catch(() => []),
    ])
      .then(([lasCiudades, lasCategorias, lasCaracteristicas]) => {
        if (!vigente) return;
        setCiudades(lasCiudades);
        setCategorias(lasCategorias);
        setCaracteristicas(lasCaracteristicas);
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  return { ciudades, categorias, caracteristicas, cargando };
}
