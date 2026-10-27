import { useEffect, useMemo, useState } from "react";
import { obtenerDisponibilidad } from "../api/reservas";
import {
  DIAS,
  aTexto,
  celdasDelMes,
  esPasada,
  estaOcupada,
  nombreDelMes,
} from "../utils/calendario";
import "../styles/CalendarioDisponibilidad.css";

/**
 * Calendario doble con la disponibilidad del alojamiento: dos meses a la vista,
 * las fechas ocupadas marcadas y la selección del rango para reservar.
 *
 * Avisa al componente padre de qué rango está elegido; reservar es cosa suya.
 */
export default function CalendarioDisponibilidad({ productoId, seleccion, onSeleccionar }) {
  const [ocupadas, setOcupadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  // El primero de los dos meses que se muestran.
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");

    obtenerDisponibilidad(productoId)
      .then((datos) => vigente && setOcupadas(datos.ocupadas))
      .catch(
        () =>
          vigente &&
          setError("No pudimos consultar las fechas disponibles en este momento.")
      )
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [productoId, intento]);

  const segundoMes = useMemo(
    () => new Date(mes.getFullYear(), mes.getMonth() + 1, 1),
    [mes]
  );

  function mover(meses) {
    setMes((previo) => new Date(previo.getFullYear(), previo.getMonth() + meses, 1));
  }

  /**
   * Primer clic fija la entrada; el segundo, la salida. Si el segundo cae antes de
   * la entrada, se toma como nueva entrada en lugar de rechazarlo.
   */
  function elegirDia(fecha) {
    const dia = aTexto(fecha);
    const { entrada, salida } = seleccion;

    if (!entrada || salida || dia <= entrada) {
      onSeleccionar({ entrada: dia, salida: "" });
      return;
    }
    onSeleccionar({ entrada, salida: dia });
  }

  function estadoDelDia(fecha) {
    const dia = aTexto(fecha);
    const { entrada, salida } = seleccion;
    const dentroDelRango = entrada && salida && dia > entrada && dia < salida;

    if (esPasada(fecha)) return "pasado";
    // Un día ocupado dentro del rango elegido se marca aparte: es el que impide
    // reservar, y hay que verlo sin tener que buscarlo.
    if (estaOcupada(fecha, ocupadas)) return dentroDelRango ? "conflicto" : "ocupado";
    if (dia === entrada || dia === salida) return "extremo";
    if (dentroDelRango) return "dentro";
    return "libre";
  }

  // El mes anterior sólo tiene sentido si no es anterior al actual.
  const hoy = new Date();
  const puedeRetroceder =
    mes > new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hoyTexto = aTexto(hoy);

  /**
   * Los campos de fecha son la otra forma de elegir el rango, además del calendario.
   * Cambiar la entrada limpia la salida: un rango a medio editar confunde más de lo
   * que ayuda.
   */
  function alEscribirEntrada(evento) {
    onSeleccionar({ entrada: evento.target.value, salida: "" });
  }

  function alEscribirSalida(evento) {
    onSeleccionar({ entrada: seleccion.entrada, salida: evento.target.value });
  }

  if (cargando) {
    return <p className="estado-vacio">Consultando disponibilidad…</p>;
  }

  if (error) {
    return (
      <div className="calendario__error">
        <p className="mensaje mensaje--error">{error}</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIntento((previo) => previo + 1)}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="calendario">
      <div className="calendario__campos">
        <div className="field calendario__campo">
          <label htmlFor="calendario-entrada">Ingreso</label>
          <input
            id="calendario-entrada"
            className="input"
            type="date"
            min={hoyTexto}
            value={seleccion.entrada}
            onChange={alEscribirEntrada}
          />
        </div>

        <span className="calendario__flecha" aria-hidden="true">
          →
        </span>

        <div className="field calendario__campo">
          <label htmlFor="calendario-salida">Egreso</label>
          <input
            id="calendario-salida"
            className="input"
            type="date"
            min={seleccion.entrada || hoyTexto}
            value={seleccion.salida}
            disabled={!seleccion.entrada}
            onChange={alEscribirSalida}
          />
        </div>

        {seleccion.entrada && (
          <button
            type="button"
            className="btn btn-ghost calendario__limpiar"
            onClick={() => onSeleccionar({ entrada: "", salida: "" })}
          >
            Limpiar fechas
          </button>
        )}
      </div>

      <div className="calendario__barra">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => mover(-1)}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => mover(1)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="calendario__meses">
        {[mes, segundoMes].map((cadaMes) => (
          <div key={cadaMes.toISOString()} className="calendario__mes">
            <h3 className="calendario__nombre-mes">{nombreDelMes(cadaMes)}</h3>

            <div className="calendario__dias" role="presentation">
              {DIAS.map((dia) => (
                <span key={dia} className="calendario__dia-semana">
                  {dia}
                </span>
              ))}

              {celdasDelMes(cadaMes).map((fecha, indice) =>
                fecha === null ? (
                  <span key={`hueco-${indice}`} />
                ) : (
                  <button
                    key={aTexto(fecha)}
                    type="button"
                    className={`calendario__celda calendario__celda--${estadoDelDia(fecha)}`}
                    disabled={estaOcupada(fecha, ocupadas) || esPasada(fecha)}
                    aria-label={`${fecha.getDate()} de ${nombreDelMes(cadaMes)}${
                      estaOcupada(fecha, ocupadas) ? ", ocupado" : ""
                    }`}
                    onClick={() => elegirDia(fecha)}
                  >
                    {fecha.getDate()}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <ul className="calendario__referencias">
        <li>
          <span className="calendario__muestra calendario__muestra--libre" /> Disponible
        </li>
        <li>
          <span className="calendario__muestra calendario__muestra--ocupado" /> Ocupado
        </li>
        <li>
          <span className="calendario__muestra calendario__muestra--extremo" /> Tu estadía
        </li>
        <li>
          <span className="calendario__muestra calendario__muestra--conflicto" /> Ocupado en tu
          rango
        </li>
      </ul>
    </div>
  );
}
