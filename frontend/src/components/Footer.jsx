import "../styles/Footer.css";

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__contenido">
        <div className="footer__marca">
          <span className="footer__isologo" aria-hidden="true">
            Db
          </span>
          <p className="footer__copyright">
            {anio} &copy; Todos los derechos reservados
          </p>
        </div>

        <p className="footer__nota">Reservá tu próxima estadía</p>
      </div>
    </footer>
  );
}
