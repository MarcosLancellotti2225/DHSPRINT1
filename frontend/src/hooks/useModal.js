import { useEffect, useRef } from "react";

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento común a todos los modales:
 * cerrar con Escape, bloquear el scroll del fondo, llevar el foco adentro,
 * atraparlo mientras está abierto y devolverlo al cerrar.
 *
 * Devuelve la ref que hay que poner en el panel del modal.
 */
export default function useModal(onCerrar) {
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    const elementoPrevio = document.activeElement;

    // El foco arranca en el primer control del modal; si no hay ninguno, en el panel.
    const primerControl = panel?.querySelector(ENFOCABLES);
    (primerControl ?? panel)?.focus();

    function alPresionarTecla(evento) {
      if (evento.key === "Escape") {
        onCerrar();
        return;
      }
      if (evento.key !== "Tab" || !panel) return;

      const enfocables = [...panel.querySelectorAll(ENFOCABLES)];
      if (enfocables.length === 0) {
        evento.preventDefault();
        return;
      }

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      // Al llegar a los extremos, el foco vuelve al otro extremo en vez de
      // escaparse al contenido de atrás.
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alPresionarTecla);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowOriginal;
      elementoPrevio?.focus?.();
    };
  }, [onCerrar]);

  return panelRef;
}
