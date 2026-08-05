import "../styles/Buscador.css";

/**
 * Bloque de búsqueda del home.
 * En este sprint es sólo interfaz: todavía no hay endpoint de búsqueda, así que
 * el formulario no dispara ninguna consulta.
 */
export default function Buscador() {
  function alEnviar(evento) {
    evento.preventDefault();
  }

  return (
    <section className="buscador" aria-labelledby="buscador-titulo">
      <div className="contenedor">
        <h1 id="buscador-titulo" className="buscador__titulo">
          Buscá ofertas en hoteles, casas y mucho más
        </h1>

        <form className="buscador__formulario" onSubmit={alEnviar}>
          <div className="buscador__campo">
            <label htmlFor="destino">¿A dónde vamos?</label>
            <input id="destino" name="destino" type="text" placeholder="Ciudad, región o alojamiento" />
          </div>

          <div className="buscador__campo">
            <label htmlFor="entrada">Check in</label>
            <input id="entrada" name="entrada" type="date" />
          </div>

          <div className="buscador__campo">
            <label htmlFor="salida">Check out</label>
            <input id="salida" name="salida" type="date" />
          </div>

          <button type="submit" className="boton boton--acento buscador__enviar" disabled>
            Buscar
          </button>
        </form>

        <p className="buscador__aviso">La búsqueda se habilita en la próxima entrega.</p>
      </div>
    </section>
  );
}
