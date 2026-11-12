import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarioDisponibilidad from "./CalendarioDisponibilidad";
import { obtenerDisponibilidad } from "../api/reservas";
import { nochesOcupadasEntre } from "../utils/calendario";
import useSesion from "../hooks/useSesion";
import { formatearPrecio, totalDeEstadia } from "../utils/precio";
import "../styles/ReservaProducto.css";

const SIN_SELECCION = { entrada: "", salida: "" };

/** Noches entre dos fechas en texto. */
export function noches(entrada, salida) {
  if (!entrada || !salida) return 0;
  const unDia = 24 * 60 * 60 * 1000;
  return Math.round((new Date(salida) - new Date(entrada)) / unDia);
}

/**
 * Bloque de reserva del detalle: el calendario con la disponibilidad y el resumen
 * de la estadía elegida. No reserva: lleva a la página de reserva, que es donde se
 * revisan los datos antes de confirmar. Sin sesión iniciada manda a ingresar y
 * vuelve acá con las fechas ya elegidas.
 */
export default function ReservaProducto({ producto }) {
  const { autenticado } = useSesion();
  const navegar = useNavigate();

  const [seleccion, setSeleccion] = useState(SIN_SELECCION);
  const [huespedes, setHuespedes] = useState(2);
  const [error, setError] = useState("");
  const [ocupadas, setOcupadas] = useState([]);
  // Fuerza a recargar la disponibilidad al volver de reservar.
  const [version] = useState(0);

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

  function continuar() {
    const destino = {
      pathname: `/reservar/${producto.id}`,
      search: `?entrada=${seleccion.entrada}&salida=${seleccion.salida}&huespedes=${huespedes}`,
    };

    // Sin sesión no se puede reservar: se manda a ingresar guardando a dónde volver,
    // así las fechas elegidas no se pierden en el camino.
    if (!autenticado) {
      navegar("/ingresar", {
        state: { desde: `${destino.pathname}${destino.search}`, motivo: "reservar" },
      });
      return;
    }
    navegar(`${destino.pathname}${destino.search}`);
  }

  return (
    <section className="reserva" aria-labelledby="reserva-titulo">
      <h2 id="reserva-titulo" className="titulo-seccion">
        Disponibilidad
      </h2>

      {error && <p className="mensaje mensaje--error">{error}</p>}

      <CalendarioDisponibilidad
        key={version}
        productoId={producto.id}
        seleccion={seleccion}
        onSeleccionar={(nueva) => {
          setSeleccion(nueva);
          setError("");
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
              {totalDeEstadia(producto.precioPorNoche, seleccion.entrada, seleccion.salida) && (
                <p className="reserva__total">
                  Total:{" "}
                  <strong>
                    {formatearPrecio(
                      totalDeEstadia(producto.precioPorNoche, seleccion.entrada, seleccion.salida)
                    )}
                  </strong>{" "}
                  <small>
                    ({formatearPrecio(producto.precioPorNoche)} × {cantidadDeNoches})
                  </small>
                </p>
              )}
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

          <div className="reserva__accion">
            {!autenticado && (
              <p className="reserva__aviso-sesion">
                Para reservar hace falta iniciar sesión. Te llevamos y volvés acá con las
                fechas que elegiste.
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!listaParaReservar}
              onClick={continuar}
            >
              Reservar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
