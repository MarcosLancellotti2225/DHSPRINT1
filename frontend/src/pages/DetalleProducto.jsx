import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GaleriaImagenes from "../components/GaleriaImagenes";
import Estrellas from "../components/Estrellas";
import CaracteristicasProducto from "../components/CaracteristicasProducto";
import PoliticasProducto from "../components/PoliticasProducto";
import ReservaProducto from "../components/ReservaProducto";
import ValoracionesProducto from "../components/ValoracionesProducto";
import ModalCompartir from "../components/ModalCompartir";
import { obtenerProducto } from "../api/productos";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import "../styles/DetalleProducto.css";

export default function DetalleProducto() {
  const { id } = useParams();
  const navegar = useNavigate();

  const [producto, setProducto] = useState(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Hasta que llega la respuesta no hay nombre, así que el título no se toca.
  useTituloPagina(producto?.nombre);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");

    obtenerProducto(id)
      .then((datos) => vigente && setProducto(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el alojamiento")))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id]);

  function volver() {
    // Si se entró por link directo no hay historial al que volver: al home.
    if (window.history.length > 1) {
      navegar(-1);
    } else {
      navegar("/");
    }
  }

  if (cargando) {
    return <p className="estado-vacio">Cargando alojamiento…</p>;
  }

  if (error) {
    return (
      <div className="detalle__error">
        <p className="mensaje mensaje--error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => navegar("/")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <article className="detalle">
      {/* Encabezado propio del detalle: título a la izquierda, volver a la derecha. */}
      <header className="detalle__header">
        <div className="detalle__identidad">
          <h1 className="detalle__titulo">{producto.nombre}</h1>
          {producto.categoria && (
            <span className="tag tag-outline detalle__categoria">{producto.categoria.titulo}</span>
          )}
          {producto.valoraciones > 0 && (
            <span className="detalle__puntuacion">
              <Estrellas
                valor={producto.puntuacion}
                tamanio={15}
                etiqueta={`${producto.puntuacion} de 5 estrellas`}
              />
              {producto.puntuacion} ({producto.valoraciones})
            </span>
          )}
        </div>
        <div className="detalle__acciones">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCompartiendo(true)}
          >
            Compartir
          </button>
          <button type="button" className="btn btn-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>
      </header>

      <div className="detalle__cuerpo">
        <GaleriaImagenes nombre={producto.nombre} imagenes={producto.imagenes} />

        <section className="detalle__descripcion" aria-labelledby="descripcion-titulo">
          <h2 id="descripcion-titulo" className="titulo-seccion">
            Sobre el alojamiento
          </h2>
          <p className="detalle__texto">{producto.descripcion}</p>
        </section>

        <CaracteristicasProducto caracteristicas={producto.caracteristicas ?? []} />

        <ReservaProducto producto={producto} />

        <ValoracionesProducto productoId={producto.id} />

        <PoliticasProducto />
      </div>

      {compartiendo && (
        <ModalCompartir producto={producto} onCerrar={() => setCompartiendo(false)} />
      )}
    </article>
  );
}
