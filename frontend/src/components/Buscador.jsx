import "../styles/Buscador.css";

/**
 * Buscador del home. En este sprint es sólo interfaz: todavía no hay endpoint
 * de búsqueda, así que el formulario no dispara ninguna consulta.
 */
export default function Buscador() {
  function alEnviar(evento) {
    evento.preventDefault();
  }

  return (
    <form className="card elev-md buscador" onSubmit={alEnviar}>
      <div className="buscador__campos">
        <div className="field buscador__campo buscador__campo--destino">
          <label htmlFor="destino">Destino</label>
          <input id="destino" className="input" type="text" placeholder="¿A dónde vas?" />
        </div>

        <div className="field buscador__campo">
          <label htmlFor="entrada">Check-in</label>
          <input id="entrada" className="input" type="date" />
        </div>

        <div className="field buscador__campo">
          <label htmlFor="salida">Check-out</label>
          <input id="salida" className="input" type="date" />
        </div>

        <div className="field buscador__campo buscador__campo--huespedes">
          <label htmlFor="huespedes">Huéspedes</label>
          <input id="huespedes" className="input" type="number" min="1" defaultValue={2} />
        </div>

        <button type="submit" className="btn btn-primary buscador__enviar" disabled>
          Buscar
        </button>
      </div>

      <p className="buscador__aviso">La búsqueda se habilita en la próxima entrega.</p>
    </form>
  );
}
