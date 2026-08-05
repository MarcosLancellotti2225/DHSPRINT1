package com.nexthome.reservas.config;

import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.ProductoImagen;
import com.nexthome.reservas.repository.ProductoRepository;
import com.nexthome.reservas.service.AlmacenamientoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * Con H2 en memoria la base arranca vacía en cada ejecución, así que se cargan
 * alojamientos de ejemplo (con sus imágenes) para poder ver el home funcionando.
 * Sólo corre si todavía no hay productos, por lo que al pasar a PostgreSQL no
 * duplica datos.
 */
@Configuration
public class CargaInicialDatos {

    private static final Logger log = LoggerFactory.getLogger(CargaInicialDatos.class);

    private static final int IMAGENES_POR_PRODUCTO = 6;
    private static final int ANCHO = 1200;
    private static final int ALTO = 800;

    private record Alojamiento(String nombre, String descripcion, Color desde, Color hasta) {
    }

    private static final List<Alojamiento> EJEMPLOS = List.of(
            new Alojamiento("Hotel Costa Serena",
                    "Frente al mar y a diez minutos del centro, el Costa Serena combina habitaciones amplias con vista al océano, "
                            + "desayuno buffet incluido y una piscina climatizada abierta todo el año. Ideal para escapadas largas.",
                    new Color(0x1B4965), new Color(0x62B6CB)),
            new Alojamiento("Cabañas del Bosque",
                    "Seis cabañas de madera repartidas en dos hectáreas de bosque de coníferas, cada una con hogar a leña, "
                            + "parrilla propia y galería privada. Un lugar silencioso para desconectar sin resignar comodidad.",
                    new Color(0x2D5016), new Color(0x8FBC5A)),
            new Alojamiento("Loft Centro Histórico",
                    "Loft de dos ambientes en un edificio reciclado de 1910, a una cuadra de la plaza principal. "
                            + "Techos de seis metros, cocina totalmente equipada y espacio de trabajo con fibra óptica.",
                    new Color(0x6B2737), new Color(0xE08D79)),
            new Alojamiento("Posada Valle Andino",
                    "Posada de montaña a 1.800 metros de altura, con doce habitaciones, restaurante de cocina regional "
                            + "y salidas guiadas de trekking. Las mejores vistas del valle se ven desde el desayunador.",
                    new Color(0x3D348B), new Color(0x7678ED)),
            new Alojamiento("Resort Bahía Azul",
                    "Complejo todo incluido sobre una bahía protegida: tres piscinas, spa, club infantil y deportes náuticos. "
                            + "Las habitaciones superiores tienen balcón privado con hamaca y vista directa al agua.",
                    new Color(0x006D77), new Color(0x83C5BE)),
            new Alojamiento("Hostel Puerto Viejo",
                    "Hostel de ambiente relajado a doscientos metros del puerto, con habitaciones compartidas y privadas, "
                            + "cocina comunitaria, terraza con hamacas y bicicletas gratuitas para recorrer la costanera.",
                    new Color(0x9C6644), new Color(0xE6CCB2)),
            new Alojamiento("Departamento Vista Río",
                    "Departamento de tres ambientes en un piso alto con balcón corrido y vista panorámica al río. "
                            + "Edificio con pileta, gimnasio y cochera cubierta incluida en la estadía.",
                    new Color(0x14213D), new Color(0x4A6FA5)),
            new Alojamiento("Estancia Los Álamos",
                    "Casco de estancia restaurado sobre 400 hectáreas de campo, con cabalgatas, asados criollos y pensión completa. "
                            + "Siete habitaciones con baño en suite y una biblioteca con chimenea.",
                    new Color(0x774936), new Color(0xC9A227)),
            new Alojamiento("Suites del Lago",
                    "Suites independientes al borde del lago, con muelle propio, kayaks a disposición y desayuno servido en la habitación. "
                            + "Cada suite tiene ventanal completo orientado al amanecer.",
                    new Color(0x1D3557), new Color(0xA8DADC)),
            new Alojamiento("Casa Colonial Palermo",
                    "Casa colonial de dos plantas con patio andaluz, cuatro habitaciones y living con biblioteca. "
                            + "Está en pleno barrio de Palermo, rodeada de bares, restaurantes y galerías de arte.",
                    new Color(0x5F0F40), new Color(0xE36414)),
            new Alojamiento("Refugio Nieve Grande",
                    "Refugio a pie de pista con guardaesquís, secadora de botas y after ski frente a la chimenea. "
                            + "Media pensión incluida y traslado gratuito a la base del cerro cada media hora.",
                    new Color(0x264653), new Color(0xB8D8D8)),
            new Alojamiento("Villa Olivos del Sur",
                    "Villa mediterránea entre olivares, con piscina de borde infinito, quincho techado y capacidad para diez personas. "
                            + "Incluye degustación de aceites de la finca y servicio de limpieza diario.",
                    new Color(0x606C38), new Color(0xDDA15E))
    );

    @Bean
    CommandLineRunner cargarAlojamientosDeEjemplo(ProductoRepository repository, AlmacenamientoService almacenamiento) {
        return args -> {
            if (repository.count() > 0) {
                log.info("La base ya tiene productos, se omite la carga inicial");
                return;
            }

            for (Alojamiento ejemplo : EJEMPLOS) {
                Producto producto = new Producto(ejemplo.nombre(), ejemplo.descripcion());
                for (int i = 1; i <= IMAGENES_POR_PRODUCTO; i++) {
                    byte[] png = generarImagen(ejemplo, i);
                    producto.agregarImagen(new ProductoImagen(almacenamiento.guardarBytes(png, "png")));
                }
                repository.save(producto);
            }
            log.info("Se cargaron {} alojamientos de ejemplo con {} imágenes cada uno",
                    EJEMPLOS.size(), IMAGENES_POR_PRODUCTO);
        };
    }

    /** Genera una imagen de muestra con degradado y rótulo, para no depender de archivos externos. */
    private byte[] generarImagen(Alojamiento alojamiento, int numero) throws IOException {
        BufferedImage imagen = new BufferedImage(ANCHO, ALTO, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagen.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // El ángulo del degradado cambia por imagen para que la galería no se vea repetida.
            float desplazamiento = (numero - 1) / (float) IMAGENES_POR_PRODUCTO;
            g.setPaint(new GradientPaint(
                    ANCHO * desplazamiento, 0, alojamiento.desde(),
                    ANCHO, ALTO * (1 - desplazamiento * 0.5f), alojamiento.hasta()));
            g.fillRect(0, 0, ANCHO, ALTO);

            g.setColor(new Color(255, 255, 255, 38));
            for (int i = 0; i < 5; i++) {
                int radio = 260 + i * 150;
                g.drawOval(ANCHO - 320 - radio / 2, ALTO - 120 - radio / 2, radio, radio);
            }

            g.setColor(new Color(255, 255, 255, 235));
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 64));
            g.drawString(alojamiento.nombre(), 72, ALTO - 132);

            g.setColor(new Color(255, 255, 255, 170));
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 34));
            g.drawString("Foto " + numero + " de " + IMAGENES_POR_PRODUCTO, 72, ALTO - 76);
        } finally {
            g.dispose();
        }

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        ImageIO.write(imagen, "png", salida);
        return salida.toByteArray();
    }
}
