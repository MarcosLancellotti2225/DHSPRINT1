import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarMisReservas } from "../api/reservas";
import { mensajeDeError } from "../api/client";
import useTituloPagina from "../hooks/useTituloPagina";
import { formatearPrecio } from "../utils/precio";
import { enTextoLargo } from "./Reservar";
import "../styles/MisReservas.css";

/**
 * Fecha en que se hizo la reserva. Es distinta de las fechas de la estadía, y el
 * historial muestra las dos: una dice cuándo se reservó, la otra cuándo se usa.
 */
export function fechaDeReserva(instante) {
  if (!instante) return "";
  const fecha = new Date(instante);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Separa las reservas en las que todavía no terminaron y las que ya pasaron. El
 * backend ya marca cuáles están finalizadas, así que acá sólo se agrupan: lo que
 * viene primero es lo que el usuario puede llegar a necesitar.
 */
export function separarPorEstado(reservas) {
  return {
    proximas: reservas.filter((reserva) => !reserva.finalizada),
    pasadas: reservas.filter((reserva) => reserva.finalizada),
  };
}

function FilaDeReserva({ reserva }) {
  return (
    <li className="card elev-sm reserva-item">
      <div className="reserva-item__datos">
        <h3 className="card-title reserva-item__titulo">
          <Link to={`/producto/${reserva.productoId}`}>{reserva.producto}</Link>
        </h3>
        <p className="reserva-item__fechas">
          {enTextoLargo(reserva.entrada)} → {enTextoLargo(reserva.salida)}
        </p>
        <p className="reserva-item__detalle">
          {reserva.noches} {reserva.noches === 1 ? "noche" : "noches"} ·{" "}
          {reserva.huespedes} {reserva.huespedes === 1 ? "huésped" : "huéspedes"} ·
          reserva #{reserva.id}
        </p>
        {fechaDeReserva(reserva.creadaEn) && (
          <p className="reserva-item__creada">
            Reservada el {fechaDeReserva(reserva.creadaEn)}
          </p>
        )}
      </div>

      <div className="reserva-item__monto">
        {formatearPrecio(reserva.total) && (
          <strong className="reserva-item__total">{formatearPrecio(reserva.total)}</strong>
        )}
        <span className={`tag ${reserva.finalizada ? "tag-outline" : "tag-accent"}`}>
          {reserva.finalizada ? "Finalizada" : "Próxima"}
        </span>
      </div>
    </li>
  );
}

/** Historial de reservas del usuario identificado. */
export default function MisReservas() {
  useTituloPagina("Mis reservas");

  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    listarMisReservas()
      .then((datos) => vigente && setReservas(datos))
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudieron cargar tus reservas")))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  const { proximas, pasadas } = separarPorEstado(reservas);

  return (
    <div className="mis-reservas">
      <header className="mis-reservas__header">
        <h1 className="mis-reservas__titulo">Mis reservas</h1>
      </header>

      {error && <p className="mensaje mensaje--error">{error}</p>}

      {cargando ? (
        <p className="estado-vacio">Cargando tus reservas…</p>
      ) : reservas.length === 0 ? (
        <div className="mis-reservas__vacio">
          <p className="estado-vacio">Todavía no hiciste ninguna reserva.</p>
          <Link to="/" className="btn btn-primary">
            Buscar alojamientos
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="proximas-titulo">
            <h2 id="proximas-titulo" className="titulo-seccion">
              Próximas estadías
            </h2>
            {proximas.length === 0 ? (
              <p className="estado-vacio">No tenés estadías próximas.</p>
            ) : (
              <ul className="mis-reservas__lista">
                {proximas.map((reserva) => (
                  <FilaDeReserva key={reserva.id} reserva={reserva} />
                ))}
              </ul>
            )}
          </section>

          {pasadas.length > 0 && (
            <section aria-labelledby="pasadas-titulo">
              <h2 id="pasadas-titulo" className="titulo-seccion">
                Estadías anteriores
              </h2>
              <ul className="mis-reservas__lista">
                {pasadas.map((reserva) => (
                  <FilaDeReserva key={reserva.id} reserva={reserva} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
