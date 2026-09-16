package com.nexthome.reservas.config;

import com.nexthome.reservas.model.Caracteristica;
import com.nexthome.reservas.model.Categoria;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.ProductoImagen;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.CaracteristicaRepository;
import com.nexthome.reservas.repository.CategoriaRepository;
import com.nexthome.reservas.repository.ProductoRepository;
import com.nexthome.reservas.repository.UsuarioRepository;
import com.nexthome.reservas.service.AlmacenamientoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.Polygon;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;

/**
 * Con H2 en memoria la base arranca vacía en cada ejecución, así que se cargan
 * el administrador, las categorías, las características y los alojamientos de
 * ejemplo (con sus imágenes) para poder ver el sitio funcionando.
 * Cada bloque sólo corre si su tabla está vacía, por lo que al pasar a PostgreSQL
 * no duplica datos.
 *
 * Las fotos salen de {@code resources/imagenes-ejemplo/} (autores y licencias en
 * {@code CREDITOS.csv}). Si a algún alojamiento o categoría le faltan, se genera un
 * paisaje en su lugar: la carga nunca queda sin imágenes.
 */
@Configuration
@Profile("!test")
public class CargaInicialDatos {

    private static final Logger log = LoggerFactory.getLogger(CargaInicialDatos.class);

    private static final String CARPETA_FOTOS = "classpath:imagenes-ejemplo/";

    /** Cantidad de paisajes que se generan cuando un alojamiento no tiene fotos propias. */
    private static final int IMAGENES_POR_PRODUCTO = 6;
    private static final int ANCHO = 1200;
    private static final int ALTO = 800;

    private record Paleta(Color desde, Color hasta) {
    }

    private record CategoriaEjemplo(String titulo, String descripcion, Paleta paleta) {
    }

    private record CaracteristicaEjemplo(String nombre, String icono) {
    }

    private record Alojamiento(String nombre, String descripcion, Paleta paleta,
                               String categoria, List<String> caracteristicas) {
    }

    private static final List<CategoriaEjemplo> CATEGORIAS = List.of(
            new CategoriaEjemplo("Hoteles",
                    "Estadías con servicio de recepción, limpieza diaria y desayuno.",
                    new Paleta(new Color(0x1B4965), new Color(0x62B6CB))),
            new CategoriaEjemplo("Departamentos",
                    "Unidades completas con cocina propia, ideales para estadías largas.",
                    new Paleta(new Color(0x14213D), new Color(0x4A6FA5))),
            new CategoriaEjemplo("Cabañas",
                    "Casas de madera en entornos naturales, con parrilla y galería.",
                    new Paleta(new Color(0x2D5016), new Color(0x8FBC5A))),
            new CategoriaEjemplo("Hostels",
                    "Habitaciones compartidas o privadas con espacios comunes.",
                    new Paleta(new Color(0x9C6644), new Color(0xE6CCB2))),
            new CategoriaEjemplo("Resorts",
                    "Complejos con todo incluido, piscinas, spa y actividades.",
                    new Paleta(new Color(0x006D77), new Color(0x83C5BE))),
            new CategoriaEjemplo("Casas",
                    "Casas enteras para grupos y familias, con patio o jardín.",
                    new Paleta(new Color(0x774936), new Color(0xC9A227)))
    );

    /**
     * El campo "icono" es un identificador de texto: el dibujo lo resuelve el
     * frontend, en la base no se guarda ningún SVG.
     */
    private static final List<CaracteristicaEjemplo> CARACTERISTICAS = List.of(
            new CaracteristicaEjemplo("Wi-Fi", "wifi"),
            new CaracteristicaEjemplo("Pileta", "pileta"),
            new CaracteristicaEjemplo("Cocina equipada", "cocina"),
            new CaracteristicaEjemplo("Estacionamiento", "estacionamiento"),
            new CaracteristicaEjemplo("Aire acondicionado", "aire"),
            new CaracteristicaEjemplo("Desayuno incluido", "desayuno"),
            new CaracteristicaEjemplo("Apto mascotas", "mascotas"),
            new CaracteristicaEjemplo("Televisión", "tv"),
            new CaracteristicaEjemplo("Gimnasio", "gimnasio"),
            new CaracteristicaEjemplo("Spa", "spa")
    );

    private static final List<Alojamiento> EJEMPLOS = List.of(
            new Alojamiento("Hotel Costa Serena",
                    "Frente al mar y a diez minutos del centro, el Costa Serena combina habitaciones amplias con vista al océano, "
                            + "desayuno buffet incluido y una piscina climatizada abierta todo el año. Ideal para escapadas largas.",
                    new Paleta(new Color(0x1B4965), new Color(0x62B6CB)),
                    "Hoteles", List.of("Wi-Fi", "Pileta", "Desayuno incluido", "Aire acondicionado", "Televisión")),
            new Alojamiento("Cabañas del Bosque",
                    "Seis cabañas de madera repartidas en dos hectáreas de bosque de coníferas, cada una con hogar a leña, "
                            + "parrilla propia y galería privada. Un lugar silencioso para desconectar sin resignar comodidad.",
                    new Paleta(new Color(0x2D5016), new Color(0x8FBC5A)),
                    "Cabañas", List.of("Wi-Fi", "Cocina equipada", "Estacionamiento", "Apto mascotas")),
            new Alojamiento("Loft Centro Histórico",
                    "Loft de dos ambientes en un edificio reciclado de 1910, a una cuadra de la plaza principal. "
                            + "Techos de seis metros, cocina totalmente equipada y espacio de trabajo con fibra óptica.",
                    new Paleta(new Color(0x6B2737), new Color(0xE08D79)),
                    "Departamentos", List.of("Wi-Fi", "Cocina equipada", "Aire acondicionado", "Televisión")),
            new Alojamiento("Posada Valle Andino",
                    "Posada de montaña a 1.800 metros de altura, con doce habitaciones, restaurante de cocina regional "
                            + "y salidas guiadas de trekking. Las mejores vistas del valle se ven desde el desayunador.",
                    new Paleta(new Color(0x3D348B), new Color(0x7678ED)),
                    "Hoteles", List.of("Wi-Fi", "Desayuno incluido", "Estacionamiento", "Apto mascotas")),
            new Alojamiento("Resort Bahía Azul",
                    "Complejo todo incluido sobre una bahía protegida: tres piscinas, spa, club infantil y deportes náuticos. "
                            + "Las habitaciones superiores tienen balcón privado con hamaca y vista directa al agua.",
                    new Paleta(new Color(0x006D77), new Color(0x83C5BE)),
                    "Resorts", List.of("Wi-Fi", "Pileta", "Spa", "Gimnasio", "Desayuno incluido", "Aire acondicionado")),
            new Alojamiento("Hostel Puerto Viejo",
                    "Hostel de ambiente relajado a doscientos metros del puerto, con habitaciones compartidas y privadas, "
                            + "cocina comunitaria, terraza con hamacas y bicicletas gratuitas para recorrer la costanera.",
                    new Paleta(new Color(0x9C6644), new Color(0xE6CCB2)),
                    "Hostels", List.of("Wi-Fi", "Cocina equipada", "Apto mascotas")),
            new Alojamiento("Departamento Vista Río",
                    "Departamento de tres ambientes en un piso alto con balcón corrido y vista panorámica al río. "
                            + "Edificio con pileta, gimnasio y cochera cubierta incluida en la estadía.",
                    new Paleta(new Color(0x14213D), new Color(0x4A6FA5)),
                    "Departamentos", List.of("Wi-Fi", "Pileta", "Gimnasio", "Estacionamiento", "Cocina equipada")),
            new Alojamiento("Estancia Los Álamos",
                    "Casco de estancia restaurado sobre 400 hectáreas de campo, con cabalgatas, asados criollos y pensión completa. "
                            + "Siete habitaciones con baño en suite y una biblioteca con chimenea.",
                    new Paleta(new Color(0x774936), new Color(0xC9A227)),
                    "Casas", List.of("Wi-Fi", "Desayuno incluido", "Estacionamiento", "Apto mascotas", "Pileta")),
            new Alojamiento("Suites del Lago",
                    "Suites independientes al borde del lago, con muelle propio, kayaks a disposición y desayuno servido en la habitación. "
                            + "Cada suite tiene ventanal completo orientado al amanecer.",
                    new Paleta(new Color(0x1D3557), new Color(0xA8DADC)),
                    "Hoteles", List.of("Wi-Fi", "Desayuno incluido", "Spa", "Televisión")),
            new Alojamiento("Casa Colonial Palermo",
                    "Casa colonial de dos plantas con patio andaluz, cuatro habitaciones y living con biblioteca. "
                            + "Está en pleno barrio de Palermo, rodeada de bares, restaurantes y galerías de arte.",
                    new Paleta(new Color(0x5F0F40), new Color(0xE36414)),
                    "Casas", List.of("Wi-Fi", "Cocina equipada", "Aire acondicionado", "Televisión")),
            new Alojamiento("Refugio Nieve Grande",
                    "Refugio a pie de pista con guardaesquís, secadora de botas y after ski frente a la chimenea. "
                            + "Media pensión incluida y traslado gratuito a la base del cerro cada media hora.",
                    new Paleta(new Color(0x264653), new Color(0xB8D8D8)),
                    "Cabañas", List.of("Wi-Fi", "Desayuno incluido", "Spa", "Estacionamiento")),
            new Alojamiento("Villa Olivos del Sur",
                    "Villa mediterránea entre olivares, con piscina de borde infinito, quincho techado y capacidad para diez personas. "
                            + "Incluye degustación de aceites de la finca y servicio de limpieza diario.",
                    new Paleta(new Color(0x606C38), new Color(0xDDA15E)),
                    "Casas", List.of("Wi-Fi", "Pileta", "Cocina equipada", "Estacionamiento", "Aire acondicionado"))
    );

    private final ResourcePatternResolver recursos = new PathMatchingResourcePatternResolver();
    private final String emailAdmin;
    private final String passwordAdmin;

    public CargaInicialDatos(@Value("${app.admin.email}") String emailAdmin,
                             @Value("${app.admin.password}") String passwordAdmin) {
        this.emailAdmin = emailAdmin;
        this.passwordAdmin = passwordAdmin;
    }

    @Bean
    CommandLineRunner cargarDatosDeEjemplo(UsuarioRepository usuarioRepository,
                                           CategoriaRepository categoriaRepository,
                                           CaracteristicaRepository caracteristicaRepository,
                                           ProductoRepository productoRepository,
                                           AlmacenamientoService almacenamiento,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            crearAdministrador(usuarioRepository, passwordEncoder);
            Map<String, Categoria> categorias = cargarCategorias(categoriaRepository, almacenamiento);
            Map<String, Caracteristica> caracteristicas = cargarCaracteristicas(caracteristicaRepository);
            cargarAlojamientos(productoRepository, almacenamiento, categorias, caracteristicas);
        };
    }

    /**
     * Sin un administrador cargado de fábrica nadie podría entrar al panel la primera
     * vez ni, por lo tanto, darle el permiso a otro usuario.
     */
    private void crearAdministrador(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        String email = emailAdmin.trim().toLowerCase(Locale.ROOT);
        if (repository.existsByEmailIgnoreCase(email)) {
            log.info("El administrador {} ya existe, se omite su creación", email);
            return;
        }
        repository.save(new Usuario("Marcos", "Lancellotti", email,
                passwordEncoder.encode(passwordAdmin), Rol.ADMIN));
        log.info("Se creó el administrador inicial {}", email);
    }

    private Map<String, Categoria> cargarCategorias(CategoriaRepository repository,
                                                    AlmacenamientoService almacenamiento) throws IOException {
        Map<String, Categoria> porTitulo = new LinkedHashMap<>();

        if (repository.count() > 0) {
            repository.findAll().forEach(categoria -> porTitulo.put(categoria.getTitulo(), categoria));
            return porTitulo;
        }

        for (CategoriaEjemplo ejemplo : CATEGORIAS) {
            String imagen = fotoDeCategoria(ejemplo, almacenamiento);
            Categoria categoria = repository.save(
                    new Categoria(ejemplo.titulo(), ejemplo.descripcion(), imagen));
            porTitulo.put(categoria.getTitulo(), categoria);
        }
        log.info("Se cargaron {} categorías", porTitulo.size());
        return porTitulo;
    }

    private Map<String, Caracteristica> cargarCaracteristicas(CaracteristicaRepository repository) {
        Map<String, Caracteristica> porNombre = new LinkedHashMap<>();

        if (repository.count() > 0) {
            repository.findAll().forEach(caracteristica -> porNombre.put(caracteristica.getNombre(), caracteristica));
            return porNombre;
        }

        for (CaracteristicaEjemplo ejemplo : CARACTERISTICAS) {
            Caracteristica caracteristica = repository.save(
                    new Caracteristica(ejemplo.nombre(), ejemplo.icono()));
            porNombre.put(caracteristica.getNombre(), caracteristica);
        }
        log.info("Se cargaron {} características", porNombre.size());
        return porNombre;
    }

    private void cargarAlojamientos(ProductoRepository repository,
                                    AlmacenamientoService almacenamiento,
                                    Map<String, Categoria> categorias,
                                    Map<String, Caracteristica> caracteristicas) throws IOException {
        if (repository.count() > 0) {
            log.info("La base ya tiene productos, se omite la carga inicial");
            return;
        }

        for (Alojamiento ejemplo : EJEMPLOS) {
            Producto producto = new Producto(ejemplo.nombre(), ejemplo.descripcion());
            producto.setCategoria(categorias.get(ejemplo.categoria()));

            Set<Caracteristica> asociadas = new LinkedHashSet<>();
            for (String nombre : ejemplo.caracteristicas()) {
                Caracteristica caracteristica = caracteristicas.get(nombre);
                if (caracteristica != null) {
                    asociadas.add(caracteristica);
                }
            }
            producto.setCaracteristicas(asociadas);

            for (String url : fotosDeAlojamiento(ejemplo, almacenamiento)) {
                producto.agregarImagen(new ProductoImagen(url));
            }
            repository.save(producto);
        }
        log.info("Se cargaron {} alojamientos de ejemplo", EJEMPLOS.size());
    }

    /**
     * Fotos de {@code imagenes-ejemplo/alojamientos/<slug>/} en orden de nombre, así la
     * 01.jpg queda como portada. Sin fotos, se generan paisajes.
     */
    private List<String> fotosDeAlojamiento(Alojamiento ejemplo, AlmacenamientoService almacenamiento)
            throws IOException {
        Resource[] fotos = recursos.getResources(
                CARPETA_FOTOS + "alojamientos/" + slug(ejemplo.nombre()) + "/*.jpg");
        List<String> urls = new ArrayList<>();

        if (fotos.length > 0) {
            Arrays.sort(fotos, Comparator.comparing(Resource::getFilename));
            for (Resource foto : fotos) {
                urls.add(almacenamiento.guardarBytes(leer(foto), "jpg"));
            }
            return urls;
        }

        log.warn("No hay fotos de ejemplo para \"{}\", se generan paisajes", ejemplo.nombre());
        for (int i = 1; i <= IMAGENES_POR_PRODUCTO; i++) {
            urls.add(almacenamiento.guardarBytes(generarImagen(ejemplo.nombre(), ejemplo.paleta(), i), "png"));
        }
        return urls;
    }

    private String fotoDeCategoria(CategoriaEjemplo ejemplo, AlmacenamientoService almacenamiento)
            throws IOException {
        Resource foto = recursos.getResource(CARPETA_FOTOS + "categorias/" + slug(ejemplo.titulo()) + ".jpg");
        if (foto.exists()) {
            return almacenamiento.guardarBytes(leer(foto), "jpg");
        }
        log.warn("No hay foto de ejemplo para la categoría \"{}\", se genera un paisaje", ejemplo.titulo());
        return almacenamiento.guardarBytes(generarImagen(ejemplo.titulo(), ejemplo.paleta(), 1), "png");
    }

    /** Se lee como stream y no como archivo: dentro del .jar las fotos no son archivos sueltos. */
    private static byte[] leer(Resource recurso) throws IOException {
        try (InputStream entrada = recurso.getInputStream()) {
            return entrada.readAllBytes();
        }
    }

    /** "Cabañas del Bosque" pasa a "cabanas-del-bosque", el nombre de la carpeta de sus fotos. */
    static String slug(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT).trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    /**
     * Respaldo cuando falta una foto: genera un paisaje genérico con cielo en
     * degradado, sol y capas de relieve recortadas contra el horizonte. No depende de
     * archivos ni de red, y cada imagen sale distinta según el nombre y el número.
     */
    private byte[] generarImagen(String nombre, Paleta paleta, int numero) throws IOException {
        BufferedImage imagen = new BufferedImage(ANCHO, ALTO, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagen.createGraphics();

        // Semilla estable: la misma foto se ve siempre igual, pero cada una difiere.
        Random azar = new Random(nombre.hashCode() * 31L + numero);

        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            // --- Cielo ---
            g.setPaint(new GradientPaint(0, 0, aclarar(paleta.desde(), 0.55f),
                    0, ALTO * 0.72f, paleta.hasta()));
            g.fillRect(0, 0, ANCHO, ALTO);

            // --- Sol, en distinta posición por foto ---
            int solX = (int) (ANCHO * (0.18 + 0.64 * azar.nextDouble()));
            int solY = (int) (ALTO * (0.14 + 0.20 * azar.nextDouble()));
            int solR = 70 + azar.nextInt(45);
            for (int halo = 5; halo >= 1; halo--) {
                g.setColor(new Color(255, 245, 220, 16));
                int r = solR + halo * 46;
                g.fillOval(solX - r, solY - r, r * 2, r * 2);
            }
            g.setColor(new Color(255, 248, 232, 235));
            g.fillOval(solX - solR, solY - solR, solR * 2, solR * 2);

            // --- Capas de relieve: de la más lejana y clara a la más cercana y oscura ---
            int capas = 4;
            for (int capa = 0; capa < capas; capa++) {
                double avance = (capa + 1) / (double) capas;
                int base = (int) (ALTO * (0.46 + 0.16 * capa));
                int amplitud = (int) (ALTO * (0.16 - 0.025 * capa));

                Polygon relieve = new Polygon();
                relieve.addPoint(0, ALTO);
                int puntos = 5 + capa;
                for (int p = 0; p <= puntos; p++) {
                    int x = (int) (ANCHO * p / (double) puntos);
                    int y = base - (int) (amplitud * Math.abs(Math.sin(p * 1.7 + azar.nextDouble() * 2)));
                    relieve.addPoint(x, y);
                }
                relieve.addPoint(ANCHO, ALTO);

                g.setColor(mezclar(paleta.desde(), Color.BLACK, (float) (0.15 + 0.5 * avance)));
                g.fillPolygon(relieve);
            }

            // --- Neblina sobre el horizonte, para dar profundidad ---
            g.setPaint(new GradientPaint(0, ALTO * 0.42f, new Color(255, 255, 255, 46),
                    0, ALTO * 0.68f, new Color(255, 255, 255, 0)));
            g.fillRect(0, (int) (ALTO * 0.42f), ANCHO, (int) (ALTO * 0.30f));
        } finally {
            g.dispose();
        }

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        ImageIO.write(imagen, "png", salida);
        return salida.toByteArray();
    }

    private static Color aclarar(Color color, float proporcion) {
        return mezclar(color, Color.WHITE, proporcion);
    }

    /** Interpola entre dos colores; proporcion 0 devuelve el primero, 1 el segundo. */
    private static Color mezclar(Color a, Color b, float proporcion) {
        float p = Math.clamp(proporcion, 0f, 1f);
        return new Color(
                Math.round(a.getRed() + (b.getRed() - a.getRed()) * p),
                Math.round(a.getGreen() + (b.getGreen() - a.getGreen()) * p),
                Math.round(a.getBlue() + (b.getBlue() - a.getBlue()) * p));
    }
}
