import { useCallback, useEffect, useState } from "react";
import Estrellas from "./Estrellas";
import { listarValoraciones, valorarProducto } from "../api/valoraciones";
import { mensajeDeError } from "../api/client";
import useSesion from "../hooks/useSesion";
import "../styles/ValoracionesProducto.css";

/** "2026-10-26T12:00:00Z" -> "26 de octubre de 2026" */
function fechaLegible(instante) {
  return new Date(instante).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Opiniones del alojamiento: el promedio, el formulario para quien ya se hospedó
 * y la lista de reseñas publicadas.
 */
export default function ValoracionesProducto({ productoId }) {
  const { autenticado } = useSesion();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await listarValoraciones(productoId);
      setDatos(respuesta);
      // Si ya había puntuado, el formulario arranca con lo suyo.
      setEstrellas(respuesta.miValoracion?.estrellas ?? 0);
      setComentario(respuesta.miValoracion?.comentario ?? "");
    } catch {
      setError("No pudimos cargar las opiniones en este momento.");
    } finally {
      setCargando(false);
    }
  }, [productoId]);

  useEffect(() => {
    cargar();
  }, [cargar, autenticado]);

  async function publicar(evento) {
    evento.preventDefault();
    setError("");
    setAviso("");

    if (estrellas === 0) {
      setError("Elegí cuántas estrellas le ponés.");
      return;
    }

    setEnviando(true);
    try {
      await valorarProducto(productoId, { estrellas, comentario });
      setAviso(datos?.miValoracion ? "Actualizamos tu opinión." : "¡Gracias por tu opinión!");
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo publicar tu opinión"));
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <p className="estado-vacio">Cargando opiniones…</p>;
  }

  const resenias = datos?.resenias ?? [];

  return (
    <section className="valoraciones" aria-labelledby="valoraciones-titulo">
      <div className="valoraciones__encabezado">
        <h2 id="valoraciones-titulo" className="titulo-seccion valoraciones__titulo">
          Opiniones
        </h2>

        {datos?.cantidad > 0 && (
          <div className="valoraciones__resumen">
            <Estrellas
              valor={datos.promedio}
              etiqueta={`Promedio de ${datos.promedio} de 5 estrellas`}
            />
            <strong className="valoraciones__promedio">{datos.promedio}</strong>
            <span className="valoraciones__cantidad">
              {datos.cantidad === 1 ? "1 opinión" : `${datos.cantidad} opiniones`}
            </span>
          </div>
        )}
      </div>

      {aviso && <p className="mensaje mensaje--exito">{aviso}</p>}
      {error && <p className="mensaje mensaje--error">{error}</p>}

      {datos?.puedePuntuar && (
        <form className="valoraciones__formulario" onSubmit={publicar} noValidate>
          <p className="valoraciones__invitacion">
            {datos.miValoracion ? "Tu opinión" : "Te alojaste acá. ¿Cómo estuvo?"}
          </p>

          <Estrellas valor={estrellas} onElegir={setEstrellas} tamanio={26} />

          <div className="field valoraciones__campo">
            <label htmlFor="comentario">Tu comentario (opcional)</label>
            <textarea
              id="comentario"
              className="input"
              rows={3}
              maxLength={2000}
              placeholder="Contanos cómo fue tu estadía"
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? "Publicando…" : datos.miValoracion ? "Actualizar opinión" : "Publicar opinión"}
          </button>
        </form>
      )}

      {resenias.length === 0 ? (
        <p className="valoraciones__vacio">
          Todavía nadie opinó sobre este alojamiento.
          {!autenticado && " Si te alojaste acá, iniciá sesión para contarnos cómo estuvo."}
        </p>
      ) : (
        <ul className="valoraciones__lista">
          {resenias.map((resenia) => (
            <li key={resenia.id} className="valoraciones__item">
              <div className="valoraciones__cabecera">
                <Estrellas valor={resenia.estrellas} tamanio={15} />
                <span className="valoraciones__autor">{resenia.autor}</span>
                <span className="valoraciones__fecha">{fechaLegible(resenia.publicadaEn)}</span>
              </div>
              {resenia.comentario && (
                <p className="valoraciones__comentario">{resenia.comentario}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
