# NextHome · Tu próxima estadía, en un clic

NextHome es un sitio de reservas de alojamientos: hoteles, departamentos, cabañas y hostels.
Lo armé como Desafío Profesional, tomando como referencia sitios del estilo de Booking pero
con identidad propia.

La idea es simple. Entrás al home y te encontrás con una selección de alojamientos que
cambia en cada visita, podés filtrar por categoría, meterte en cualquiera para ver sus
fotos, su descripción y sus características, y si sos administrador tenés un panel aparte
para gestionar el catálogo.

Son dos aplicaciones que conviven en el mismo repositorio: una API en **Java con Spring
Boot** (`backend/`) y un sitio en **React con Vite** (`frontend/`).

## Qué se puede hacer

**Como visitante**

Al entrar al home vas a ver un buscador, las categorías de alojamiento y un bloque de
recomendaciones con hasta 10 alojamientos elegidos al azar, distintos en cada visita y sin
repetirse entre sí. Más abajo está el catálogo completo, paginado de a 10.

Las categorías funcionan como filtro: podés marcar varias a la vez y el listado te muestra
cuántos alojamientos cumplen el filtro sobre el total del catálogo. El filtrado lo resuelve
el backend, no el navegador, así que se combina bien con la paginación. Un botón limpia
todo y te devuelve al listado completo.

Si entrás a cualquier alojamiento, arriba te espera una galería: una foto grande a la
izquierda y cuatro más en una grilla a la derecha. Con el "Ver más" de la esquina se abren
todas las fotos que tenga cargadas. Abajo de la descripción está el bloque de
**características** —wifi, pileta, cocina, lo que tenga— cada una con su ícono.

El buscador todavía no busca de verdad, es sólo la interfaz. Eso llega en el próximo sprint.

**Como usuario registrado**

Podés crear una cuenta con tu nombre, apellido, email y contraseña. El formulario valida
todo en el momento y te avisa campo por campo qué falta, sin borrarte lo que ya escribiste.
Si el email ya está en uso te lo dice explícitamente.

Una vez adentro, el header cambia: en lugar de los botones de cuenta aparece un avatar con
tus iniciales. Desplegándolo tenés tus datos y la opción de cerrar sesión. La sesión
sobrevive a las recargas de página, y al cerrarla seguís navegando el sitio como anónimo
sin que nada te bloquee.

**Como administrador**

Entrás por `/administracion` y tenés seis funciones:

- **Lista de productos**: ver el catálogo, editar cualquier alojamiento o eliminarlo.
- **Agregar producto**: nombre, descripción, categoría, características y fotos.
- **Editar producto**: lo mismo, sobre uno ya publicado. Si no elegís fotos nuevas se
  conservan las que tenía; si elegís, reemplazan a las anteriores.
- **Agregar categoría**: título, descripción e imagen representativa. También se editan y
  se eliminan (los alojamientos que la tenían quedan sin categoría, no se borran).
- **Administrar características**: alta, edición y baja, cada una con su ícono asociado.
- **Usuarios registrados**: el listado completo, con la posibilidad de dar y quitar
  permisos de administrador.

Antes de borrar cualquier cosa siempre te pide confirmación.

Dos aclaraciones importantes:

- **Nadie puede quitarse a sí mismo el permiso de administrador.** Si el último
  administrador pudiera hacerlo, el sistema quedaría sin nadie que pueda volver a
  asignarlo.
- **El panel no anda en celulares**, y es a propósito. Si entrás desde una pantalla chica
  te muestra un cartel explicándote que uses una computadora.

## Para levantarlo

Vas a necesitar **Java 21 o más**, **Maven** y **Node 18 o más**.

Son dos terminales, una para cada aplicación.

En la primera, el backend:

```bash
cd backend
mvn spring-boot:run
```

Queda en `http://localhost:8080`.

Como la base de desarrollo es H2 en memoria, arranca vacía cada vez que la levantás. Para
que no te encuentres con un home pelado, al iniciar se cargan solos el usuario
administrador, 6 categorías, 10 características y 12 alojamientos de ejemplo con sus fotos,
ya categorizados y con características asignadas. Ojo con esto: **lo que cargues por el
panel se pierde al reiniciar el backend**. Es lo esperable en desarrollo, y más abajo está
cómo pasar a una base de verdad.

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

### Cómo entrar como administrador

Alguien tiene que poder entrar al panel la primera vez, así que al arrancar se crea un
administrador si todavía no existe:

| Email | Contraseña |
| --- | --- |
| `admin@nexthome.com` | `Admin1234` |

Con esa cuenta entrás a `/administracion` y desde ahí podés darle permisos a cualquier otro
usuario registrado. Las credenciales se cambian con las variables de entorno `ADMIN_EMAIL`
y `ADMIN_PASSWORD`; **para producción, cambialas**.

### Cómo registrarse

Desde "Crear cuenta" en el header, o entrando directo a `/crear-cuenta`. Pide nombre,
apellido, email y una contraseña de al menos 8 caracteres. Apenas te registrás quedás
identificado, no hace falta volver a loguearte. Después se entra por `/ingresar`.

Las contraseñas se guardan hasheadas con BCrypt: nunca se guardan en texto plano ni se
devuelven en ninguna respuesta de la API.

## Configuración

El frontend sólo necesita saber dónde está la API. Por defecto asume `http://localhost:8080`,
y si necesitás otra cosa creás un `frontend/.env` con `VITE_API_URL` apuntando a donde sea
(hay un `.env.example` de referencia).

El backend anda sin configurar nada en desarrollo. Estas son las variables que lee, todas
con un valor por defecto razonable:

| Variable | Para qué | Por defecto |
| --- | --- | --- |
| `JWT_SECRET` | Clave con la que se firman los tokens. Mínimo 32 caracteres. | clave de desarrollo |
| `JWT_EXPIRATION_MINUTES` | Cuánto dura un token antes de vencer. | `120` |
| `ADMIN_EMAIL` | Email del administrador precargado. | `admin@nexthome.com` |
| `ADMIN_PASSWORD` | Su contraseña. | `Admin1234` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | PostgreSQL, sólo en el perfil `prod`. | PostgreSQL local |
| `UPLOADS_DIR` | Dónde se guardan las fotos, sólo en `prod`. | `/var/lib/nexthome/uploads` |
| `CORS_ORIGINS` | Orígenes que pueden consumir la API, sólo en `prod`. | `http://localhost:5174` |

En producción hay dos que sí o sí hay que setear: **`JWT_SECRET`** (si no, cualquiera que
lea este repositorio puede firmarse un token de administrador) y **`ADMIN_PASSWORD`**.

### Pasar de H2 a PostgreSQL

No hay que tocar una línea de Java. Está todo preparado en el perfil `prod`:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Con eso los alojamientos que cargues sobreviven a los reinicios.

## La API

Todo cuelga de `http://localhost:8080/api`. La autenticación es por **JWT**: el token se
manda en el header `Authorization: Bearer <token>`. No hay sesión de servidor, porque el
frontend es una SPA aparte.

**Autenticación** (público)

- `POST /auth/registro` crea la cuenta y devuelve el token junto con los datos del usuario.
- `POST /auth/login` mismo formato de respuesta. Si las credenciales no sirven contesta
  `401` con un mensaje genérico, sin aclarar si falló el email o la contraseña.
- `GET /auth/perfil` devuelve el usuario del token. Es el que usa el frontend para
  revalidar la sesión al recargar la página.

**Catálogo** (lectura pública, escritura sólo administradores)

- `GET /productos?page=0&size=10` trae el catálogo paginado, nunca más de 10 por página.
  Con `&categorias=1&categorias=3` lo filtra por categoría. La respuesta trae
  `totalElementos` (lo que entra en el filtro) y `totalSinFiltro` (el catálogo completo).
- `GET /productos/random?limit=10` es el que alimenta las recomendaciones del home.
- `GET /productos/{id}` trae un alojamiento con sus fotos, su categoría y sus características.
- `POST /productos` da de alta uno nuevo. Va como `multipart/form-data` con `nombre`,
  `descripcion`, uno o más archivos en `imagenes` y, opcionalmente, `categoriaId` y uno o
  más `caracteristicaIds`.
- `PUT /productos/{id}` lo edita, con el mismo formato. Acá `imagenes` es opcional: si no
  mandás ninguna se conservan las actuales.
- `DELETE /productos/{id}` lo elimina, y de paso borra sus fotos del disco.

**Categorías y características** (lectura pública, escritura sólo administradores)

- `GET /categorias`, `POST /categorias`, `PUT /categorias/{id}`, `DELETE /categorias/{id}`
- `GET /caracteristicas`, `POST /caracteristicas`, `PUT /caracteristicas/{id}`,
  `DELETE /caracteristicas/{id}`

**Usuarios** (sólo administradores)

- `GET /usuarios` el listado completo.
- `PATCH /usuarios/{id}/rol` con `{"administrador": true|false}` otorga o quita el permiso.

Las imágenes se guardan en `backend/uploads/` y se sirven desde `/uploads/**`.

Cuando algo sale mal la API contesta con un mensaje explicando qué pasó: `400` si faltan
datos, `401` si no estás identificado o el token no sirve, `403` si tu rol no alcanza, `404`
si el recurso no existe, `409` si hay un nombre o un email repetido y `413` si alguna foto
pesa más de 10 MB.

## Seguridad

El rol se valida **en el backend, en cada endpoint**. Que el frontend esconda los botones
del panel es sólo comodidad: si alguien copia el token de un usuario común e intenta hacer
un `POST /api/productos`, la API le contesta `403` igual.

El rol se relee de la base en cada request, no se confía en lo que dice el token. Así, si
un administrador le quita el permiso a alguien, el cambio es efectivo de inmediato aunque
esa persona siga teniendo su token vigente.

## Las pruebas

```bash
cd backend && mvn test        # 62 pruebas de la API
cd frontend && npm test       # 70 pruebas de componentes y páginas
```

Del lado del backend se prueban el registro, el login con credenciales válidas e inválidas,
el acceso denegado a los endpoints protegidos sin token y con rol insuficiente, el CRUD de
categorías y características, la edición y categorización de productos, y el filtrado por
categoría combinado con la paginación.

Del lado del frontend, los formularios de registro y login con sus validaciones, el avatar
con las iniciales, el cierre de sesión, el bloque de características del detalle, el filtro
por categorías y el listado de usuarios del panel.

## Fotos de ejemplo

Las fotos de los alojamientos y las categorías de ejemplo son de **Pexels**, que las
ofrece con licencia de uso libre. Están en `backend/src/main/resources/imagenes-ejemplo/`:
una carpeta por alojamiento con su nombre sin tildes (`hotel-costa-serena`,
`cabanas-del-bosque`…), donde la `01.jpg` es la portada, y una foto por categoría en
`categorias/`. El autor y el enlace original de cada una están en `CREDITOS.csv`, en esa
misma carpeta.

Para cambiar las fotos de un alojamiento alcanza con reemplazar los archivos de su
carpeta y reiniciar el backend. Si a alguno le faltan, se genera un paisaje en su lugar,
así que la carga nunca queda sin imágenes.

## Cómo está organizado

El backend sigue la separación clásica por capas: `controller` recibe los pedidos, `service`
tiene la lógica, `repository` habla con la base y `model` son las entidades. Aparte están
`dto` para lo que entra y sale de la API, `security` con el filtro de JWT y los manejadores
de error de la cadena de seguridad, y `exception` con el manejador que traduce los errores
a respuestas HTTP con sentido.

El frontend tiene una carpeta por tipo de cosa: `pages` (una por ruta), `components` (lo
reutilizable: header, footer, galería, modales, avatar), `context` (el estado de sesión),
`api` (las llamadas al backend), `hooks` y `styles`.

Sobre los estilos: no usé ningún framework de UI, es CSS propio. El sistema de diseño
—colores, tipografía, espaciado y las clases de componente (`.btn`, `.card`, `.tag`,
`.input`, `.table`, `.dialog`)— vive entero en `frontend/src/styles/index.css`. Si algún día
cambia la identidad de marca, se toca ese bloque y se actualiza el sitio sin entrar a ningún
componente.

Los íconos de las características se resuelven en el frontend: en la base se guarda sólo un
identificador de texto (`wifi`, `pileta`, `cocina`), y `components/IconoCaracteristica.jsx`
lo traduce a un SVG. Cambiar la ilustración no obliga a migrar datos.

La única dependencia visual externa es la tipografía **Inter**, que se carga desde Google
Fonts. Si el proyecto tiene que funcionar sin internet, conviene descargarla y servirla
desde `public/`.
