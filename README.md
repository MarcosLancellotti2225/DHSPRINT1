# NextHome · Reservá tu próxima estadía

NextHome es un sitio de reservas de alojamientos: hoteles, departamentos, cabañas y hostels.
Lo armé como Sprint 1 del Desafío Profesional, tomando como referencia sitios del estilo
de Booking pero con identidad propia.

La idea es simple. Entrás al home y te encontrás con una selección de alojamientos que
cambia en cada visita, podés meterte en cualquiera para ver sus fotos y su descripción, y
si sos administrador tenés un panel aparte para cargar alojamientos nuevos o dar de baja
los que ya no se ofrecen.

Son dos aplicaciones que conviven en el mismo repositorio: una API en **Java con Spring
Boot** (`backend/`) y un sitio en **React con Vite** (`frontend/`).

## Qué se puede hacer

**Como visitante**

Al entrar al home vas a ver un buscador, las categorías de alojamiento y un bloque de
recomendaciones con hasta 10 alojamientos elegidos al azar, distintos en cada visita y sin
repetirse entre sí. Más abajo está el catálogo completo, paginado de a 10.

Si entrás a cualquier alojamiento, arriba te espera una galería: una foto grande a la
izquierda y cuatro más en una grilla a la derecha. Con el "Ver más" de la esquina se abren
todas las fotos que tenga cargadas.

El buscador todavía no busca de verdad, es sólo la interfaz. Eso llega en el próximo sprint.

**Como administrador**

Entrás por `/administracion` (por ahora sin login) y tenés dos cosas: cargar un alojamiento
nuevo con su nombre, su descripción y todas las fotos que quieras, o ver la lista completa
para eliminar alguno. Antes de borrar siempre te pide confirmación, así que no hay forma de
llevarse un alojamiento puesto sin querer.

Si intentás cargar un alojamiento con un nombre que ya existe, el formulario te avisa en
vez de crear un duplicado.

Una aclaración: **el panel no anda en celulares**, y es a propósito. Si entrás desde una
pantalla chica te muestra un cartel explicándote que uses una computadora.

## Para levantarlo

Vas a necesitar **Java 17 o más**, **Maven** y **Node 18 o más**.

Son dos terminales, una para cada aplicación.

En la primera, el backend:

```bash
cd backend
mvn spring-boot:run
```

Queda en `http://localhost:8080`.

Como la base de desarrollo es H2 en memoria, arranca vacía cada vez que la levantás. Para
que no te encuentres con un home pelado, al iniciar se cargan solos 12 alojamientos de
ejemplo con sus fotos. Ojo con esto: **lo que cargues por el panel se pierde al reiniciar
el backend**. Es lo esperable en desarrollo, y más abajo está cómo pasar a una base de
verdad.

Si querés espiar la base por dentro, la consola de H2 está en `http://localhost:8080/h2-console`
(URL `jdbc:h2:mem:nexthome`, usuario `sa`, sin contraseña).

En la segunda terminal, el frontend:

```bash
cd frontend
npm install
npm run dev
```

Y ahí sí, el sitio en `http://localhost:5174`. Lo dejé en el 5174 y no en el 5173 que usa
Vite por defecto, para no pisarme con otros proyectos. Si querés cambiarlo está en
`vite.config.js`.

## Configuración

El frontend sólo necesita saber dónde está la API. Por defecto asume `http://localhost:8080`,
y si necesitás otra cosa creás un `frontend/.env` con `VITE_API_URL` apuntando a donde sea
(hay un `.env.example` de referencia).

El backend no necesita nada para desarrollo. Para producción lee `DB_URL`, `DB_USER`,
`DB_PASSWORD`, `UPLOADS_DIR` y `CORS_ORIGINS`, todas con valores por defecto razonables en
`application-prod.properties`.

### Pasar de H2 a PostgreSQL

No hay que tocar una línea de Java. Está todo preparado en el perfil `prod`:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Con eso los alojamientos que cargues sobreviven a los reinicios.

## La API

Todo cuelga de `http://localhost:8080/api`:

- `GET /productos?page=0&size=10` trae el catálogo paginado, nunca más de 10 por página.
- `GET /productos/random?limit=10` es el que alimenta las recomendaciones del home.
- `GET /productos/{id}` trae un alojamiento con todas sus fotos.
- `POST /productos` da de alta uno nuevo. Va como `multipart/form-data` con `nombre`,
  `descripcion` y uno o más archivos en `imagenes`.
- `DELETE /productos/{id}` lo elimina, y de paso borra sus fotos del disco.

Las imágenes se guardan en `backend/uploads/` y se sirven desde `/uploads/**`.

Cuando algo sale mal la API contesta con un mensaje explicando qué pasó: `400` si faltan
datos, `404` si el alojamiento no existe, `409` si el nombre está repetido y `413` si alguna
foto pesa más de 10 MB.

## Cómo está organizado

El backend sigue la separación clásica por capas: `controller` recibe los pedidos, `service`
tiene la lógica, `repository` habla con la base y `model` son las entidades. Aparte están
`dto` para lo que entra y sale de la API, y `exception` con el manejador que traduce los
errores a respuestas HTTP con sentido.

El frontend tiene una carpeta por tipo de cosa: `pages` (una por ruta), `components` (lo
reutilizable: header, footer, galería, modales), `api` (las llamadas al backend), `hooks` y
`styles`.

Sobre los estilos: no usé ningún framework de UI, es CSS propio. Todos los colores,
tipografías y medidas viven como variables en `frontend/src/styles/index.css`. Si algún día
cambia la identidad de marca, se toca ese bloque y se actualiza el sitio entero sin entrar a
ningún componente.

## Créditos

Los íconos de la interfaz son [Uicons de Flaticon](https://www.flaticon.com/uicons).
Su licencia permite el uso gratuito siempre que se acredite la autoría, que es lo que hace
esta sección.
