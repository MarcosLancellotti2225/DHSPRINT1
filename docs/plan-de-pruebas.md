# Plan de pruebas · NextHome

Casos de prueba derivados de las historias de usuario, y su estado de ejecución.

- **Automatizadas:** 112 del backend (JUnit + MockMvc) y 163 del frontend (Vitest +
  Testing Library), **275 en total**.
- **Última ejecución:** todas en verde.

```bash
cd backend && mvn test      # 112
cd frontend && npm test     # 163
```

---

## 1. Estrategia

### Qué se prueba en cada nivel

**Backend, pruebas de integración.** Levantan la aplicación completa contra una base H2 en
memoria y pegan a los endpoints reales con MockMvc, incluyendo la cadena de seguridad. No
hay mocks del repositorio: si una consulta JPQL está mal escrita, la prueba falla. Esto es
deliberado, porque los errores que aparecieron en el proyecto fueron justamente de ese
tipo: reglas de seguridad mal ordenadas, claves foráneas, el momento en que Hibernate
ejecuta un `insert`.

**Frontend, pruebas de componente.** Renderizan el componente y lo operan como lo haría una
persona: buscan por rol y por etiqueta accesible, hacen clic, escriben. Las llamadas al
backend van mockeadas. Se evita a propósito consultar por clases CSS, para que un cambio de
estilos no rompa una prueba de comportamiento.

**Sin pruebas unitarias de servicios.** Con esta cantidad de lógica, una prueba unitaria con
el repositorio mockeado verificaría que el código llama a lo que creemos que llama, no que
funciona. Las de integración cubren lo mismo con más valor.

### Qué no se prueba automáticamente

| Qué | Por qué | Cómo se verifica |
| --- | --- | --- |
| Diseño responsive | jsdom no tiene layout real | Manual, redimensionando el navegador |
| Carga de archivos reales | Las imágenes se simulan con bytes | Manual, subiendo fotos desde el panel |
| Redirección a redes sociales | Abre un sitio externo | Se verifica la URL construida; el salto es manual |
| Persistencia en PostgreSQL | Las pruebas corren sobre H2 | Manual, levantando el perfil `prod` |

---

## 2. Casos por historia

Cada caso indica dónde está automatizado. **M** = verificación manual.

### #22 Realizar búsqueda

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 22.1 | Escribir "bari" en destino | Sugiere Bariloche con su país | `Buscador.test.jsx` |
| 22.2 | Escribir sin tildes ("cordoba") | Encuentra "Córdoba" igual | `Buscador.test.jsx` |
| 22.3 | Escribir el nombre de un país | Sugiere las ciudades de ese país | `Buscador.test.jsx` |
| 22.4 | Buscar sin elegir destino de la lista | Avisa y no busca | `Buscador.test.jsx`, `Home.test.jsx` |
| 22.5 | Destino sin coincidencias | "No tenemos alojamientos en ese destino" | `Buscador.test.jsx` |
| 22.6 | Check-out anterior o igual al check-in | Rechaza el rango | `Buscador.test.jsx` |
| 22.7 | Buscar por destino | Devuelve sólo los de esa ciudad | `ProductoControllerTest`, `Home.test.jsx` |
| 22.8 | Buscar con rango de fechas | Descarta los ocupados en ese rango | `ReservaControllerTest` |
| 22.9 | Buscar con media fecha | No filtra por disponibilidad | `ReservaControllerTest` |
| 22.10 | Combinar destino + categoría | Aplica los dos filtros | `ProductoControllerTest`, `Home.test.jsx` |
| 22.11 | Al buscar, el home conserva su diseño | Categorías y recomendaciones siguen visibles | `Home.test.jsx` |
| 22.12 | Filtro combinado con paginación | Máximo 10 por página | `ProductoControllerTest` |

### #23 Visualizar disponibilidad

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 23.1 | Abrir el detalle | Muestra dos meses a la vez | `CalendarioDisponibilidad.test.jsx` |
| 23.2 | Alojamiento con reservas | Fechas ocupadas tachadas y deshabilitadas | `CalendarioDisponibilidad.test.jsx` |
| 23.3 | Primer clic | Fija la entrada y deja la salida abierta | `CalendarioDisponibilidad.test.jsx` |
| 23.4 | Segundo clic | Fija la salida del rango | `CalendarioDisponibilidad.test.jsx` |
| 23.5 | Rango que pisa una reserva | Marca esas noches y bloquea reservar | `CalendarioDisponibilidad.test.jsx` |
| 23.6 | Escribir la fecha en el campo | Sincroniza con el calendario | `CalendarioDisponibilidad.test.jsx` |
| 23.7 | Falla la consulta de disponibilidad | Mensaje claro + botón Reintentar | `CalendarioDisponibilidad.test.jsx` |
| 23.8 | Reintentar tras un error | Vuelve a consultar y muestra el calendario | `CalendarioDisponibilidad.test.jsx` |
| 23.9 | Consultar disponibilidad sin sesión | Es público, responde 200 | `ReservaControllerTest` |
| 23.10 | Reservar fechas ya tomadas | Responde 409 | `ReservaControllerTest` |
| 23.11 | Entrar el día que otro se va | Lo permite (rango semiabierto) | `ReservaControllerTest` |
| 23.12 | Reservar con fecha pasada | Responde 400 | `ReservaControllerTest` |
| 23.13 | Estadía mayor al tope de 30 noches | Responde 400 | `ReservaControllerTest` |
| 23.14 | Reservar sin sesión | Responde 401 | `ReservaControllerTest` |
| 23.15 | Calendario en pantalla chica | Los meses se apilan | **M** |

### #24 Marcar como favorito

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 24.1 | Visitante anónimo | El corazón no se muestra | `BotonFavorito.test.jsx` |
| 24.2 | Usuario identificado | Marca con un solo clic | `BotonFavorito.test.jsx` |
| 24.3 | Clic en un favorito marcado | Lo desmarca | `BotonFavorito.test.jsx` |
| 24.4 | Clic en el corazón de una tarjeta | No navega al detalle | **M** (verificado en navegador) |
| 24.5 | Marcar dos veces el mismo | No se duplica | `FavoritoControllerTest` |
| 24.6 | Falla el backend al marcar | El corazón no queda marcado | `BotonFavorito.test.jsx` |
| 24.7 | Marcar sin sesión (API directa) | Responde 401 | `FavoritoControllerTest` |
| 24.8 | Corazón en pantalla táctil | Área de toque más grande | **M** |

### #25 Listar productos favoritos

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 25.1 | Acceso desde el avatar | Lleva a Mis favoritos con el contador | `AvatarUsuario.test.jsx` |
| 25.2 | Lista con favoritos | Los muestra, del más reciente al más viejo | `Favoritos.test.jsx`, `FavoritoControllerTest` |
| 25.3 | Lista vacía | Invita a marcar alguno | `Favoritos.test.jsx` |
| 25.4 | Quitar desde la lista | Desaparece al instante, sin recargar | `Favoritos.test.jsx` |
| 25.5 | Favoritos de otro usuario | Cada uno ve sólo los suyos | `FavoritoControllerTest` |
| 25.6 | Eliminar un producto favoriteado | Se suelta el favorito, no rompe | `FavoritoControllerTest` |

### #26 Ver bloque de políticas

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 26.1 | Abrir el detalle | Muestra el bloque con su título | `PoliticasProducto.test.jsx` |
| 26.2 | Cada política | Tiene título y descripción | `PoliticasProducto.test.jsx` |
| 26.3 | Falla la API de políticas | El bloque no se muestra, el detalle sigue | `PoliticasProducto.test.jsx` |
| 26.4 | Sin políticas cargadas | El bloque no aparece | `PoliticasProducto.test.jsx` |
| 26.5 | Título subrayado y ancho completo | Según el diseño pedido | **M** |
| 26.6 | Distribución en columnas | 3 en desktop, 2 en tablet, 1 en mobile | **M** |

### #27 Compartir productos

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 27.1 | Clic en Compartir | Abre la ventana emergente | `ModalCompartir.test.jsx` |
| 27.2 | Contenido de la ventana | Imagen, descripción y enlace | `ModalCompartir.test.jsx` |
| 27.3 | Opciones de red | Facebook, X y WhatsApp | `ModalCompartir.test.jsx` |
| 27.4 | Mensaje propuesto | Se puede editar | `ModalCompartir.test.jsx` |
| 27.5 | Elegir una red | Abre su URL con enlace y mensaje | `ModalCompartir.test.jsx` |
| 27.6 | Mensaje editado | Se comparte el editado, no el propuesto | `ModalCompartir.test.jsx` |
| 27.7 | Copiar enlace | Va al portapapeles y confirma | `ModalCompartir.test.jsx` |
| 27.9 | Enlace a la vista | Se puede copiar para cualquier otro medio | `ModalCompartir.test.jsx` |
| 27.10 | Cada red con su logo | Se muestra el ícono de la red | `ModalCompartir.test.jsx` |
| 27.8 | Publicación efectiva en la red | Se abre el diálogo de la red | **M** |

### #28 Puntuar producto

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 28.1 | Usuario que se hospedó | Puede puntuar | `ValoracionControllerTest` |
| 28.2 | Usuario que nunca se alojó | Responde 403 | `ValoracionControllerTest` |
| 28.3 | Estadía todavía en curso | No puede puntuar aún | `ValoracionControllerTest` |
| 28.4 | Puntuar sin sesión | Responde 401 | `ValoracionControllerTest` |
| 28.5 | Puntuación fuera de 1 a 5 | Responde 400 | `ValoracionControllerTest` |
| 28.6 | Comentario vacío | Se acepta, es opcional | `ValoracionControllerTest` |
| 28.7 | Puntuar dos veces | Actualiza, no duplica | `ValoracionControllerTest` |
| 28.8 | Promedio de varias reseñas | Se calcula bien | `ValoracionControllerTest` |
| 28.9 | Reseña publicada | Muestra estrellas, autor, fecha y comentario | `ValoracionesProducto.test.jsx` |
| 28.10 | Promedio en el detalle | Visible con la cantidad | `ValoracionControllerTest` |
| 28.11 | Promedio en el listado | Visible en cada tarjeta | `ValoracionControllerTest` |
| 28.12 | Sin reseñas | Promedio en cero y aviso | `ValoracionesProducto.test.jsx` |
| 28.13 | Quien ya puntuó | El formulario trae su opinión | `ValoracionesProducto.test.jsx` |
| 28.14 | Publicar sin elegir estrellas | Avisa y no envía | `ValoracionesProducto.test.jsx` |

### #29 Eliminar categoría

| # | Caso | Resultado esperado | Dónde |
| --- | --- | --- | --- |
| 29.1 | Opción en el panel | Visible en cada fila | `AdminCategorias.test.jsx` |
| 29.2 | Clic en Eliminar | Abre confirmación nombrando la categoría | `AdminCategorias.test.jsx` |
| 29.3 | Categoría con alojamientos | Avisa cuántos quedarán sin categoría | `AdminCategorias.test.jsx` |
| 29.4 | Categoría sin alojamientos | Lo aclara | `AdminCategorias.test.jsx` |
| 29.5 | Cancelar | No elimina nada | `AdminCategorias.test.jsx` |
| 29.6 | Confirmar | La elimina y avisa | `AdminCategorias.test.jsx` |
| 29.7 | Tras eliminar | Los alojamientos quedan sin categoría, no se borran | `CategoriaControllerTest` |
| 29.8 | Eliminar sin ser administrador | Responde 403 | `CategoriaControllerTest` |

### Regresión de sprints anteriores

Se siguen ejecutando en cada corrida: autenticación y roles (`AutenticacionControllerTest`,
`UsuarioControllerTest`), catálogo y paginación (`ProductoControllerTest`), categorías y
características (`CategoriaControllerTest`, `CaracteristicaControllerTest`), y del lado del
frontend el registro, el login, el avatar, la galería y el panel.

---

## 3. Cobertura por archivo

### Backend · 112 pruebas

| Clase | Casos |
| --- | --- |
| `ProductoControllerTest` | 28 |
| `ReservaControllerTest` | 17 |
| `ValoracionControllerTest` | 15 |
| `AutenticacionControllerTest` | 14 |
| `CategoriaControllerTest` | 12 |
| `FavoritoControllerTest` | 10 |
| `CaracteristicaControllerTest` | 9 |
| `UsuarioControllerTest` | 7 |

### Frontend · 163 pruebas

| Archivo | Casos |
| --- | --- |
| `Buscador.test.jsx` | 16 |
| `calendario.test.js` | 14 |
| `CalendarioDisponibilidad.test.jsx` | 13 |
| `Home.test.jsx` | 11 |
| `ValoracionesProducto.test.jsx` | 10 |
| `AvatarUsuario.test.jsx` | 8 |
| `Categorias.test.jsx` | 8 |
| `ModalCompartir.test.jsx` | 9 |
| `useModal.test.jsx`, `Registro.test.jsx` | 6 cada uno |
| `BotonFavorito`, `Paginacion`, `AdminCategorias`, `AdminListaProductos`, `AdminUsuarios` | 5 cada uno |
| `Estrellas`, `GaleriaImagenes`, `ImagenProducto`, `PanelAdmin`, `PoliticasProducto`, `Favoritos`, `AdminNuevoProducto`, `useTituloPagina` | 4 cada uno |
| `CaracteristicasProducto`, `Login` | 3 cada uno |

---

## 4. Defectos encontrados y corregidos

Los cuatro los detectaron las pruebas automatizadas antes de llegar al navegador.

| # | Defecto | Severidad | Detectado por | Estado |
| --- | --- | --- | --- | --- |
| D1 | `GET /api/ciudades` devolvía 401: faltaba en las rutas públicas. El buscador no habría cargado ningún destino para un visitante. | Alta | `ProductoControllerTest` | Corregido |
| D2 | Marcar dos veces un favorito daba 500. Hibernate difiere el `insert` al commit, así que el `catch` nunca se ejecutaba. | Media | `FavoritoControllerTest` | Corregido |
| D3 | El `POST` de valoraciones exigía rol ADMIN: lo atrapaba la regla de `POST /api/productos/**`. Ningún usuario común habría podido puntuar. | Alta | `ValoracionControllerTest` | Corregido |
| D4 | Eliminar un producto fallaba por clave foránea cuando tenía favoritos, reservas o valoraciones. | Alta | `FavoritoControllerTest`, `ReservaControllerTest` | Corregido |

### Observación de proceso

Los cuatro defectos son de integración entre capas, no de lógica de negocio. Ninguno
habría aparecido con pruebas unitarias con el repositorio mockeado: D1 y D3 están en la
configuración de seguridad, D2 en el ciclo de vida de la transacción y D4 en el esquema de
la base. Es el argumento más fuerte a favor de la estrategia elegida.
