import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ImagenProducto from "../components/ImagenProducto";
import Estrellas from "../components/Estrellas";
import { obtenerProducto } from "../api/productos";
import { crearReserva } from "../api/reservas";
import { mensajeDeError } from "../api/client";
import useSesion from "../hooks/useSesion";
import useTituloPagina from "../hooks/useTituloPagina";
import { formatearPrecio, nochesEntre, totalDeEstadia } from "../utils/precio";
import "../styles/Reservar.css";

/**
 * Lo que puede estar mal en lo que llega por la URL. Se valida acá y no sólo en el
 * backend porque el usuario puede editar la dirección a mano, y conviene explicarle
 * el problema antes de mandarlo a completar una reserva que va a fallar.
 */
export function validarEstadia({ entrada, salida, huespedes }, capacidad) {
  if (!entrada || !salida) return "Faltan las fechas de la estadía. Elegilas en el calendario.";
  if (nochesEntre(entrada, salida) <= 0) {
    return "La fecha de salida tiene que ser posterior a la de entrada.";
  }
  if (!huespedes || huespedes < 1) return "Indicá cuántos huéspedes se alojan.";
  if (capacidad && huespedes > capacidad) {
    return `Este alojamiento recibe hasta ${capacidad} huéspedes y pediste ${huespedes}.`;
  }
  return "";
}

/** Fecha ISO en formato legible: "2026-12-10" → "10 de diciembre de 2026". */
export function enTextoLargo(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Página de reserva: muestra el alojamiento, los datos de quien reserva y la estadía
 * elegida, para revisar todo antes de confirmar. Es un paso aparte del detalle a
 * propósito: confirmar una reserva no debería pasar de un clic sin revisión.
 */
export default function Reservar() {
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const { usuario } = useSesion();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const estadia = {
    entrada: parametros.get("entrada") ?? "",
    salida: parametros.get("salida") ?? "",
    huespedes: Number(parametros.get("huespedes")) || 0,
  };

  useTituloPagina(producto ? `Reservar ${producto.nombre}` : "Reservar");

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    obtenerProducto(id)
      .then((datos) => vigente && setProducto(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el alojamiento")))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id]);

  const problemaConLaEstadia = producto ? validarEstadia(estadia, producto.capacidad) : "";
  const noches = nochesEntre(estadia.entrada, estadia.salida);
  const total = producto ? totalDeEstadia(producto.precioPorNoche, estadia.entrada, estadia.salida) : null;

  async function confirmar() {
    setError("");
    setConfirmando(true);
    try {
      const reserva = await crearReserva({
        productoId: producto.id,
        entrada: estadia.entrada,
        salida: estadia.salida,
        huespedes: estadia.huespedes,
      });
      // La confirmación va por state: es de un solo uso y no tiene por qué quedar
      // en una URL que se pueda recargar o compartir.
      navegar("/reserva-confirmada", { replace: true, state: { reserva, producto } });
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo confirmar la reserva"));
      setConfirmando(false);
    }
  }

  if (cargando) {
    return <p className="estado-vacio">Cargando el alojamiento…</p>;
  }

  if (!producto) {
    return (
      <div className="reservar__vacio">
        <p className="mensaje mensaje--error">{error || "No encontramos ese alojamiento."}</p>
        <Link to="/" className="btn btn-secondary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const portada = producto.imagenes?.[0];

  return (
    <div className="reservar">
      <header className="reservar__header">
        <h1 className="reservar__titulo">Confirmá tu reserva</h1>
        <Link to={`/producto/${producto.id}`} className="btn btn-secondary">
          ← Volver al alojamiento
        </Link>
      </header>

      {error && <p className="mensaje mensaje--error">{error}</p>}
      {problemaConLaEstadia && (
        <p className="mensaje mensaje--error" role="alert">
          {problemaConLaEstadia}{" "}
          <Link to={`/producto/${producto.id}`}>Elegí las fechas de nuevo.</Link>
        </p>
      )}

      <div className="reservar__cuerpo">
        <section className="card elev-sm reservar__bloque" aria-labelledby="alojamiento-titulo">
          <h2 id="alojamiento-titulo" className="titulo-seccion">
            El alojamiento
          </h2>

          <div className="reservar__producto">
            <ImagenProducto
              url={portada?.url}
              alt={producto.nombre}
              className="reservar__imagen"
            />
            <div>
              <h3 className="card-title">{producto.nombre}</h3>
              {producto.categoria && (
                <span className="tag tag-outline">{producto.categoria.titulo}</span>
              )}
              {producto.ciudad && (
                <p className="reservar__ciudad">
                  {producto.ciudad.nombre}, {producto.ciudad.pais}
                </p>
              )}
              {producto.valoraciones > 0 && (
                <span className="reservar__puntuacion">
                  <Estrellas
                    valor={producto.puntuacion}
                    tamanio={14}
                    etiqueta={`${producto.puntuacion} de 5 estrellas`}
                  />
                  {producto.puntuacion} ({producto.valoraciones})
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="card elev-sm reservar__bloque" aria-labelledby="usuario-titulo">
          <h2 id="usuario-titulo" className="titulo-seccion">
            Tus datos
          </h2>

          <dl className="reservar__datos">
            <div>
              <dt>Nombre</dt>
              <dd>
                {usuario?.nombre} {usuario?.apellido}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{usuario?.email}</dd>
            </div>
          </dl>
          <p className="reservar__nota">
            La confirmación te llega a este correo. Para cambiarlo, editá tu cuenta antes
            de reservar.
          </p>
        </section>

        <section className="card elev-sm reservar__bloque" aria-labelledby="estadia-titulo">
          <h2 id="estadia-titulo" className="titulo-seccion">
            Tu estadía
          </h2>

          <dl className="reservar__datos">
            <div>
              <dt>Check-in</dt>
              <dd>{enTextoLargo(estadia.entrada)}</dd>
            </div>
            <div>
              <dt>Check-out</dt>
              <dd>{enTextoLargo(estadia.salida)}</dd>
            </div>
            <div>
              <dt>Huéspedes</dt>
              <dd>
                {estadia.huespedes} {estadia.huespedes === 1 ? "huésped" : "huéspedes"}
              </dd>
            </div>
            <div>
              <dt>Noches</dt>
              <dd>{noches}</dd>
            </div>
          </dl>

          {total !== null && (
            <div className="reservar__total">
              <span className="reservar__total-detalle">
                {formatearPrecio(producto.precioPorNoche)} × {noches}{" "}
                {noches === 1 ? "noche" : "noches"}
              </span>
              <strong className="reservar__total-monto">{formatearPrecio(total)}</strong>
            </div>
          )}
        </section>
      </div>

      <div className="reservar__acciones">
        <button
          type="button"
          className="btn btn-primary reservar__confirmar"
          onClick={confirmar}
          disabled={confirmando || Boolean(problemaConLaEstadia)}
        >
          {confirmando ? "Confirmando…" : "Confirmar reserva"}
        </button>
      </div>
    </div>
  );
}
