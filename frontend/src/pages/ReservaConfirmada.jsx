import { Link, Navigate, useLocation } from "react-router-dom";
import useTituloPagina from "../hooks/useTituloPagina";
import { formatearPrecio } from "../utils/precio";
import { enTextoLargo } from "./Reservar";
import "../styles/Reservar.css";

/**
 * Confirmación de la reserva. Los datos llegan por el state de la navegación, no por
 * la URL: es una pantalla de un solo uso, y recargarla no debería crear otra reserva
 * ni mostrar una confirmación vieja. Sin ese state, se vuelve al historial.
 */
export default function ReservaConfirmada() {
  const ubicacion = useLocation();
  useTituloPagina("Reserva confirmada");

  const reserva = ubicacion.state?.reserva;
  const producto = ubicacion.state?.producto;

  if (!reserva) {
    return <Navigate to="/mis-reservas" replace />;
  }

  return (
    <div className="reservar confirmada">
      <div className="card elev-md confirmada__panel">
        <p className="confirmada__marca" aria-hidden="true">
          ✓
        </p>
        <h1 className="confirmada__titulo">¡Tu reserva está confirmada!</h1>
        <p className="confirmada__bajada">
          Te mandamos el detalle por correo. También lo vas a encontrar en tus reservas.
        </p>

        <dl className="reservar__datos confirmada__datos">
          <div>
            <dt>Alojamiento</dt>
            <dd>{reserva.producto ?? producto?.nombre}</dd>
          </div>
          <div>
            <dt>Check-in</dt>
            <dd>{enTextoLargo(reserva.entrada)}</dd>
          </div>
          <div>
            <dt>Check-out</dt>
            <dd>{enTextoLargo(reserva.salida)}</dd>
          </div>
          <div>
            <dt>Huéspedes</dt>
            <dd>
              {reserva.huespedes} {reserva.huespedes === 1 ? "huésped" : "huéspedes"}
            </dd>
          </div>
          <div>
            <dt>Noches</dt>
            <dd>{reserva.noches}</dd>
          </div>
          {formatearPrecio(reserva.total) && (
            <div>
              <dt>Total</dt>
              <dd>
                <strong>{formatearPrecio(reserva.total)}</strong>
              </dd>
            </div>
          )}
          <div>
            <dt>Número de reserva</dt>
            <dd>#{reserva.id}</dd>
          </div>
        </dl>

        <div className="confirmada__acciones">
          <Link to="/mis-reservas" className="btn btn-primary">
            Ver mis reservas
          </Link>
          <Link to="/" className="btn btn-secondary">
            Seguir buscando
          </Link>
        </div>
      </div>
    </div>
  );
}
