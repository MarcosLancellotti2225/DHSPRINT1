import "../styles/Categorias.css";

/**
 * Categorías del home. Todavía no filtran ni traen conteos: el backend no
 * expone categorías, así que se muestran los tipos sin el contador que
 * aparece en el diseño (ver README).
 */
const CATEGORIAS = [
  "Hoteles",
  "Departamentos",
  "Cabañas",
  "Hostels",
  "Resorts",
  "Casas",
];

export default function Categorias() {
  return (
    <section className="categorias" aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo" className="titulo-seccion">
        Categorías
      </h2>

      <ul className="categorias__lista">
        {CATEGORIAS.map((nombre) => (
          <li key={nombre}>
            <div className="card categorias__tarjeta">
              <div className="categorias__nombre">{nombre}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
