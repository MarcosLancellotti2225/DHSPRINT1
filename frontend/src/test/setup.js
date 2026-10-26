import "@testing-library/jest-dom/vitest";

/*
 * jsdom no implementa matchMedia, y el panel de administración lo usa para
 * detectar pantallas chicas. Por defecto simulamos una pantalla grande; los
 * tests que necesiten lo contrario sobrescriben el mock.
 */
if (!window.matchMedia) {
  window.matchMedia = (consulta) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

/*
 * jsdom tampoco implementa scrollIntoView, que el home usa para llevar la vista al
 * listado. Sin este stub cada test que busca o cambia de página ensucia la salida
 * con un TypeError que no dice nada.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
