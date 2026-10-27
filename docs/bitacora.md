# Bitácora del proyecto · NextHome

Documento de gestión del Desafío Profesional. Acá está qué se construyó, por qué se
tomaron las decisiones que se tomaron y cómo avanzó el trabajo sprint a sprint.

---

## 1. Definición del proyecto

### El problema

Buscar alojamiento es incómodo cuando la oferta está dispersa: hay que entrar a varios
sitios, comparar a mano y volver atrás para no perder lo que a uno le gustó. Del lado de
quien administra el catálogo, el problema es el inverso: cargar y mantener las
publicaciones suele requerir herramientas separadas del sitio público.

### La solución

**NextHome** es un sitio de reservas de alojamientos —hoteles, departamentos, cabañas,
hostels, resorts y casas— con dos caras bien separadas:

**Para quien busca**, un sitio público donde encontrar alojamientos por destino y fechas,
filtrar por categoría, ver el detalle con sus fotos, características y políticas, guardar
los que interesan como favoritos, reservar una estadía y opinar sobre dónde se alojó.

**Para quien administra**, un panel con el alta, la edición y la baja de alojamientos, la
gestión de categorías y características, y la administración de permisos de otros
usuarios.

### Alcance

| Dentro del alcance | Fuera del alcance |
| --- | --- |
| Catálogo de alojamientos con fotos | Pagos y cobros |
| Búsqueda por destino, fechas y categoría | Mensajería entre huésped y anfitrión |
| Cuentas de usuario con roles | Cancelación de reservas desde el sitio |
| Reservas con control de disponibilidad | Notificaciones por email |
| Favoritos y valoraciones | Aplicación móvil nativa |
| Panel de administración | Multi-idioma y multi-moneda |

Reservar, en este alcance, significa **bloquear fechas**. No hay transacción de dinero: no
aparece en ninguna historia de usuario y agregarla habría implicado integrar un medio de
pago, con todo lo que eso trae.

### Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Frontend | React 19 + Vite | SPA liviana, sin framework de UI: el diseño es propio |
| Backend | Java 21 + Spring Boot 3.4 | Separación por capas clara y ecosistema maduro |
| Base de datos | H2 en desarrollo, PostgreSQL en producción | Se cambia de perfil sin tocar código |
| Seguridad | Spring Security + JWT + BCrypt | Sin sesión de servidor: el frontend es una SPA aparte |
| Pruebas | JUnit + MockMvc, Vitest + Testing Library | Pruebas de API reales y de componentes |

### Modelo de dominio

```
Usuario ──< Favorito >── Producto ──> Ciudad
   │                        │   │
   │                        │   └──> Categoria
   ├──< Reserva >───────────┤
   └──< Valoracion >────────┤
                            ├──< ProductoImagen
                            └──< Caracteristica (N:M)

Politica  (independiente: aplica a todo el catálogo)
```

---

## 2. Decisiones de arquitectura

Las decisiones que no son obvias y que convendría poder defender.

### El rol se relee de la base en cada request

El token JWT lleva el rol, pero no se confía en él: el filtro de autenticación vuelve a
leer el usuario. Si un administrador le quita el permiso a alguien, el cambio es efectivo
de inmediato aunque esa persona siga con su token vigente. Confiar en el claim habría sido
más rápido, pero dejaría una ventana de hasta dos horas con permisos que ya no
corresponden.

### Las fechas de reserva usan un rango semiabierto

La fecha de salida **no** cuenta como noche ocupada: ese día el huésped se va y puede
entrar otro. Por eso dos reservas se superponen sólo cuando `entrada < otra.salida && salida > otra.entrada`.
Es como funcionan los alojamientos de verdad, y evita perder una noche entre estadías.

### Una sola consulta paginada con filtros opcionales

Ciudad, categorías y fechas son tres filtros independientes que se combinan. Con consultas
separadas harían falta ocho casi idénticas. Se resolvió con banderas (`sinFiltroDeCategorias`,
`sinFiltroDeFechas`) porque un `in` con lista vacía no existe en JPQL.

### Los íconos de características viven en el frontend

En la base se guarda sólo un identificador de texto (`wifi`, `pileta`). El SVG lo resuelve
`IconoCaracteristica.jsx`. Cambiar la ilustración no obliga a migrar datos, y la base no
guarda markup.

### Sólo puntúa quien terminó una estadía

La valoración exige una reserva con fecha de salida ya pasada en ese alojamiento. Es lo que
pide la historia #28 y lo que evita reseñas de gente que nunca se alojó.

### El panel no es responsive, a propósito

Por debajo de 880px muestra un aviso en lugar del contenido. Cargar un alojamiento con
varias fotos desde un teléfono es una mala experiencia; es preferible decirlo que ofrecer
algo que no funciona bien.

---

## 3. Avance por sprint

### Sprint 1 · El catálogo

Home con recomendaciones aleatorias y catálogo paginado de a 10, detalle con galería, y
panel de administración con alta y baja de alojamientos. Base H2 con carga inicial de 12
alojamientos de ejemplo.

### Sprint 2 · Cuentas y clasificación

Autenticación con JWT y BCrypt, registro, login, cierre de sesión y permisos de
administrador. Categorías y características, con su gestión desde el panel y el filtro por
categoría en el home. Se reemplazaron las imágenes generadas por fotos reales de Pexels.

**Problema encontrado:** al subir el Sprint 2 quedaron marcadores de conflicto de git
dentro de `index.css`, lo que rompía la compilación del frontend. Se detectó al correr
`vite build` y se corrigió con un commit de arreglo, sin reescribir la historia.

### Sprint 3 · Búsqueda, reservas y opiniones

Buscador por destino con autocompletado, calendario de disponibilidad, reservas,
favoritos, políticas, compartir en redes y valoraciones con estrellas.

**Problemas encontrados y resueltos:**

| Qué pasó | Cómo se detectó | Cómo se resolvió |
| --- | --- | --- |
| `GET /api/ciudades` devolvía 401 | Prueba de integración | Faltaba en las rutas públicas de `SeguridadConfig` |
| Marcar dos veces un favorito daba 500 | Prueba de integración | Hibernate difiere el `insert` al commit: se consulta antes en vez de atrapar la excepción |
| El `POST` de valoraciones exigía rol ADMIN | Prueba de integración | Lo atrapaba la regla de `POST /api/productos/**`; se permitió la ruta antes |
| Eliminar un producto fallaba por clave foránea | Prueba de integración | Se sueltan favoritos, reservas y valoraciones antes de borrarlo |

Los cuatro los encontraron las pruebas antes de llegar al navegador.

---

## 4. Deuda técnica conocida

Cosas que quedaron pendientes y conviene no ocultar:

- **Instagram no está entre las redes para compartir.** Su API no permite publicar desde
  la web; un botón suyo no haría nada. Se ofrece copiar el enlace en su lugar.
- **No se pueden cancelar reservas** desde el sitio. No hay historia que lo pida.
- **El email de confirmación de registro** (historia #19, opcional) no se implementó.
- **Las credenciales por defecto** (`JWT_SECRET`, `ADMIN_PASSWORD`) sirven para desarrollo.
  En producción hay que pisarlas por variables de entorno, como indica el README.
- **La paginación del panel** no tiene búsqueda por nombre: con catálogos grandes haría
  falta.
