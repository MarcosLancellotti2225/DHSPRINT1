import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CalendarioDisponibilidad from "./CalendarioDisponibilidad";
import { crearReserva, obtenerDisponibilidad } from "../api/reservas";
import { nochesOcupadasEntre } from "../utils/calendario";
import { mensajeDeError } from "../api/client";
import useSesion from "../hooks/useSesion";
import "../styles/ReservaProducto.css";

const SIN_SELECCION = { entrada: "", salida: "" };

/** Noches entre dos fechas en texto. */
export function noches(entrada, salida) {
  if (!entrada || !salida) return 0;
  const unDia = 24 * 60 * 60 * 1000;
  return Math.round((new Date(salida) - new Date(entrada)) / unDia);
}

/**
 * Bloque de reserva del detalle: el calendario con la disponibilidad y, debajo,
 * el resumen de la estadía elegida con el botón para confirmarla.
 */
export default function ReservaProducto({ producto }) {
  const { autenticado } = useSesion();

  const [seleccion, setSeleccion] = useState(SIN_SELECCION);
  const [huespedes, setHuespedes] = useState(2);
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState("");
  const [confirmada, setConfirmada] = useState(null);
  // Fuerza a recargar la disponibilidad después de reservar.
  const [version, setVersion] = useState(0);
  const [ocupadas, setOcupadas] = useState([]);

  // Misma consulta que hace el calendario, para poder avisar si el rango elegido
  // pisa una reserva antes de que el usuario intente confirmarla.
  useEffect(() => {
    let vigente = true;

    obtenerDisponibilidad(producto.id)
      .then((datos) => vigente && setOcupadas(datos.ocupadas))
      .catch(() => vigente && setOcupadas([]));

    return () => {
      vigente = false;
    };
  }, [producto.id, version]);

  const cantidadDeNoches = noches(seleccion.entrada, seleccion.salida);
  const enConflicto = nochesOcupadasEntre(seleccion.entrada, seleccion.salida, ocupadas);
  const listaParaReservar = cantidadDeNoches > 0 && enConflicto.length === 0;

  async function reservar() {
    setError("");
    setReservando(true);
    try {
      const reserva = await crearReserva({
        productoId: producto.id,
        entrada: seleccion.entrada,
        salida: seleccion.salida,
        huespedes,
      });
      setConfirmada(reserva);
      setSeleccion(SIN_SELECCION);
      setVersion((previa) => previa + 1);
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo confirmar la reserva"));
    } finally {
      setReservando(false);
    }
  }

  return (
    <section className="reserva" aria-labelledby="reserva-titulo">
      <h2 id="reserva-titulo" className="titulo-seccion">
        Disponibilidad
      </h2>

      {confirmada && (
        <p className="mensaje mensaje--exito">
          Reserva confirmada del {confirmada.entrada} al {confirmada.salida}.
        </p>
      )}
      {error && <p className="mensaje mensaje--error">{error}</p>}

      <CalendarioDisponibilidad
        key={version}
        productoId={producto.id}
        seleccion={seleccion}
        onSeleccionar={(nueva) => {
          setSeleccion(nueva);
          setError("");
          setConfirmada(null);
        }}
      />

      <div className="reserva__panel">
        <div className="reserva__resumen" aria-live="polite">
          {!seleccion.entrada ? (
            <p className="reserva__ayuda">Elegí tu fecha de entrada en el calendario.</p>
          ) : !seleccion.salida ? (
            <p className="reserva__ayuda">
              Entrada el {seleccion.entrada}. Ahora elegí la fecha de salida.
            </p>
          ) : (
            <>
              <p className="reserva__ayuda">
                Del {seleccion.entrada} al {seleccion.salida} ·{" "}
                {cantidadDeNoches === 1 ? "1 noche" : `${cantidadDeNoches} noches`}
              </p>
              {enConflicto.length > 0 && (
                <p className="reserva__conflicto">
                  {enConflicto.length === 1
                    ? `El ${enConflicto[0]} ya está reservado.`
                    : `Hay ${enConflicto.length} noches reservadas en ese rango, desde el ${enConflicto[0]}.`}{" "}
                  Elegí otra fecha de salida.
                </p>
              )}
            </>
          )}
        </div>

        <div className="reserva__controles">
          <div className="field reserva__huespedes">
            <label htmlFor="huespedes-reserva">Huéspedes</label>
            <input
              id="huespedes-reserva"
              className="input"
              type="number"
              min="1"
              max="20"
              value={huespedes}
              onChange={(evento) => setHuespedes(Number(evento.target.value))}
            />
          </div>

          {autenticado ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!listaParaReservar || reservando}
              onClick={reservar}
            >
              {reservando ? "Confirmando…" : "Reservar"}
            </button>
          ) : (
            <Link to="/ingresar" className="btn btn-primary">
              Iniciá sesión para reservar
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
