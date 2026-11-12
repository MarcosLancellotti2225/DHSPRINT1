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
afinar el resultado por huéspedes, categoría, precio y características, ver el detalle con
sus fotos, características y políticas, guardar los que interesan como favoritos, reservar
una estadía con su confirmación por correo, y opinar sobre dónde se alojó.

**Para quien administra**, un panel con el alta, la edición y la baja de alojamientos, la
gestión de categorías y características, y la administración de permisos de otros
usuarios.

### Alcance

| Dentro del alcance | Fuera del alcance |
| --- | --- |
| Catálogo de alojamientos con fotos | Pagos y cobros |
| Búsqueda por destino, fechas, huéspedes, categoría, precio y características | Mensajería entre huésped y anfitrión |
| Cuentas de usuario con roles | Cancelación de reservas desde el sitio |
| Reservas con control de disponibilidad | Aplicación móvil nativa |
| Correo de confirmación de la reserva | Multi-idioma y multi-moneda |
| Favoritos y valoraciones | Recomendaciones personalizadas |
| Panel de administración | Pasarela de pago y facturación |

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

### El rol se lee de la base, y sólo de ahí

El token lleva únicamente el email. El rol lo resuelve el filtro de autenticación
consultando al usuario en cada request, así que si un administrador le quita el permiso a
alguien, el cambio es efectivo de inmediato aunque esa persona siga con su token vigente.

Durante un tiempo el token también incluía el rol como claim, pero nadie lo leía: eran dos
fuentes para el mismo dato, y la del token podía quedar desactualizada. Se eliminó para que
haya una sola respuesta a la pregunta de qué puede hacer cada usuario.

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
favoritos, políticas, compartir en redes y valoraciones con estrellas. Los resultados se
mostraban en el mismo home; en el Sprint 4 pasaron a su propia página.

**Problemas encontrados y resueltos:**

| Qué pasó | Cómo se detectó | Cómo se resolvió |
| --- | --- | --- |
| `GET /api/ciudades` devolvía 401 | Prueba de integración | Faltaba en las rutas públicas de `SeguridadConfig` |
| Marcar dos veces un favorito daba 500 | Prueba de integración | Hibernate difiere el `insert` al commit: se consulta antes en vez de atrapar la excepción |
| El `POST` de valoraciones exigía rol ADMIN | Prueba de integración | Lo atrapaba la regla de `POST /api/productos/**`; se permitió la ruta antes |
| Eliminar un producto fallaba por clave foránea | Prueba de integración | Se sueltan favoritos, reservas y valoraciones antes de borrarlo |

Los cuatro los encontraron las pruebas antes de llegar al navegador.

### Sprint 4 · Reservas

Precio por noche en todo el circuito, página de búsqueda con filtros propios, reserva en
su propia página con revisión y confirmación, historial de reservas, botón de contacto por
WhatsApp y correo de confirmación.

Las decisiones de diseño de este sprint, con su porqué, están en la sección 5.

---

## 4. Correcciones sobre la devolución

Observaciones del profesorado sobre los sprints 2 y 3, y cómo se resolvieron.

| Observación | Resolución |
| --- | --- |
| Los errores de campo pasaban desapercibidos | Cada error se muestra junto a su campo, con `aria-invalid`, y el foco va al primero con problema |
| Faltaba validar nombre y descripción en el frontend | Se validan antes de enviar, con largo mínimo (5 y 20 caracteres), igual que en el backend |
| Ciudad y categoría no eran obligatorias | Ahora lo son en los dos lados: sin ellas el alojamiento no entraría en la búsqueda ni en el filtro |
| Los errores de imagen no decían qué archivo fallaba | El aviso nombra el archivo y su peso, y aparece al elegirlo, no al enviar |
| Las imágenes grandes rompían la descripción | La galería tiene un techo de alto y recorta en lugar de estirar el bloque |
| El claim `rol` del JWT no lo leía nadie | Se eliminó: el rol se resuelve sólo contra la base |
| El campo "Huéspedes" del buscador no hacía nada | `Producto` tiene capacidad y el buscador filtra por ella |
| La página de categorías se llamaba "Agregar categoría" | Pasó a "Categorías", que es lo que hace |

## 5. Sprint 4 · Reservas

**El precio no existía.** El proyecto llegó al Sprint 4 sin un campo de precio: no estaba
en `Producto`, ni en el formulario de alta, ni en las tarjetas. Una aplicación de reservas
sin precio no se sostiene, y la reserva necesitaba el total, así que se agregó primero:
`precioPorNoche` en la entidad, en los DTO con validación, en el formulario de
administración, en las tarjetas y en el detalle, y con precio cargado en los 12
alojamientos de ejemplo.

Se usó `BigDecimal` y no `double`. Con plata, los errores de redondeo del punto flotante
se acumulan al multiplicar por la cantidad de noches, y el total termina con centavos que
nadie puede explicar.

**El precio se congela en la reserva.** La reserva guarda su propio `precioPorNoche`,
copiado del producto al crearla, en vez de leerlo del alojamiento cada vez. Si se guardara
sólo la referencia, cambiar la tarifa modificaría el total de reservas ya hechas, que es
lo contrario de lo que espera quien reservó.

**Reservar es una página aparte, no un botón.** El bloque del detalle selecciona las
fechas y navega a `/reservar/:id`, donde se revisan el alojamiento, los datos del usuario
y la estadía antes de confirmar. Confirmar una reserva no debería pasar de un solo clic
sin una pantalla de revisión.

Las fechas viajan por la URL (`?entrada=…&salida=…&huespedes=…`) para que la página sea
enlazable y sobreviva a una recarga. Pero eso significa que se pueden editar a mano, así
que la página valida el rango y la capacidad antes de habilitar el botón, además de la
validación del backend.

**La confirmación va por el estado de la navegación, no por la URL.** Es una pantalla de
un solo uso: con los datos en la URL, recargar mostraría una confirmación vieja, y
compartir el enlace mostraría la reserva de otro. Sin ese estado, la página redirige al
historial.

**Sin sesión se avisa antes, no después.** El bloque de reserva muestra que hace falta
iniciar sesión *antes* de que el usuario lo intente, y al mandarlo a ingresar guarda a
dónde volver, así las fechas elegidas no se pierden. La página de login explica por qué se
le pidió la sesión, para que no parezca que el sitio lo expulsó.

**El correo no puede tumbar la reserva.** `CorreoService` envía la confirmación después de
que la reserva quedó guardada, y atrapa cualquier error de envío. Una reserva válida no
tiene por qué fallar porque el servidor de correo no responda.

Sin SMTP configurado (`CORREO_HABILITADO=false`, el valor por defecto) el correo no se
envía: se escribe completo en el log. En desarrollo no hay servidor de correo, y así se
puede verificar el contenido del mensaje sin montar uno.

**El filtro de huéspedes no filtraba.** Venía del Sprint 3: el campo estaba en el
buscador, pero el frontend no mandaba el dato y el backend no tenía dónde guardarlo. Se
corrigió junto con el precio, y se aprovechó para sumar los filtros de rango de precio y
de características.

Las características se piden **todas**, no cualquiera: quien filtra por pileta y cochera
quiere las dos cosas. En JPQL se resolvió contando las coincidencias y comparándolas
contra la cantidad pedida.

**El resultado de la búsqueda quedaba fuera de pantalla.** El listado iba debajo de las
categorías y las recomendaciones, como define el diseño del home, así que al buscar no se
veía nada moverse y parecía que el botón estaba roto. El primer intento fue bajar la
página sola hasta el listado, y funcionaba, pero no resolvía el problema de fondo: el
usuario buscaba y terminaba a mitad del home, con los resultados compitiendo contra dos
bloques que no tenían nada que ver con lo que había pedido.

**La búsqueda pasó a tener su propia página.** `/busqueda` muestra los resultados de
entrada, con los filtros en una columna al lado. El home volvió a ser lo que debía: la
vitrina, con el buscador, las categorías y las recomendaciones.

**Los filtros viven en la URL, no en el estado del componente.** `/busqueda` lee todo de
la query string (`?ciudad=1&huespedes=4&precioMinimo=90000`) y el efecto que trae los
resultados depende sólo de ella. Tres cosas salen gratis de esa decisión: la búsqueda se
comparte por link, el botón "atrás" del navegador deshace el último filtro, y recargar no
pierde nada. La alternativa —estado local sincronizado con la URL— son dos fuentes de
verdad que se desfasan.

Como la URL se puede escribir a mano, `leerFiltros` descarta en silencio lo que no sirve:
un id que no es número, una fecha mal formada, media fecha sin la otra. Una URL rota tiene
que degradar a una búsqueda más amplia, nunca a una página en blanco.

**El precio se aplica al confirmarlo, no al tipear.** A diferencia del resto de los
filtros, que suben a la URL al instante, el rango de precio tiene su botón: escribir "1"
de camino a "10000" dispararía una búsqueda por cada tecla, y ninguna de las intermedias
es la que el usuario quiso.

**La búsqueda espera a que el usuario termine de clickear.** Con cada filtro pegándole al
backend al instante, tildar tres categorías eran tres búsquedas y tres parpadeos de la
lista. Ahora la URL se actualiza con cada click —sigue siendo inmediata, y el botón
"atrás" recorre cada paso— pero la búsqueda sale recién 400 ms después del último cambio:
tres clicks seguidos son **una** sola consulta. Medido en el navegador.

Son dos ritmos distintos a propósito. La URL es estado de la interfaz y tiene que
responder ya; la consulta al backend es cara y puede esperar a que el usuario termine de
decidir.

**La lista anterior no se borra mientras se busca.** Antes el listado se reemplazaba por
un cartel de "Buscando alojamientos…": la grilla desaparecía, la página se encogía y daba
un salto en cada click. Ahora los resultados viejos se quedan en su lugar, atenuados y sin
poder clickearse, con un indicador animado en el contador. El contenido se reemplaza recién
cuando llegan los datos nuevos, así que la página no se mueve.

En la primera carga no hay nada que atenuar, así que van esqueletos: siluetas de tarjetas
que ocupan el espacio que van a ocupar los resultados. El objetivo es el mismo, que la
página no dé un salto cuando el contenido aparece.

Toda la animación se apaga con `prefers-reduced-motion`: el estado se sigue entendiendo
por la atenuación y por el texto.

---

## 6. Deuda técnica conocida

Cosas que quedaron pendientes y conviene no ocultar:

- **Instagram no está entre las redes para compartir.** Su API no permite publicar desde
  la web; un botón suyo no haría nada. En su lugar, el enlace queda a la vista con un
  botón para copiarlo y pegarlo donde haga falta.
- **No se pueden cancelar reservas** desde el sitio. No hay historia que lo pida.
- **El correo de confirmación de reserva sale apagado.** El servicio está implementado y
  probado, pero sin credenciales SMTP (`CORREO_HABILITADO=false`, el valor por defecto) el
  mensaje se escribe en el log en vez de enviarse. Para que salga de verdad hay que cargar
  las variables `SMTP_*` y poner esa en `true`.
- **El email de confirmación de registro** (historia #19, opcional) no se implementó.
- **Las credenciales por defecto** (`JWT_SECRET`, `ADMIN_PASSWORD`) sirven para desarrollo.
  En producción hay que pisarlas por variables de entorno, como indica el README.
- **La paginación del panel** no tiene búsqueda por nombre: con catálogos grandes haría
  falta.
