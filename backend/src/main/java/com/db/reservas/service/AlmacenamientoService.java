package com.db.reservas.service;

import com.db.reservas.exception.AlmacenamientoException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Guarda las imágenes en una carpeta local del servidor y devuelve la ruta pública
 * con la que después se sirven como recurso estático.
 */
@Service
public class AlmacenamientoService {

    private static final Logger log = LoggerFactory.getLogger(AlmacenamientoService.class);

    private static final List<String> EXTENSIONES_PERMITIDAS = List.of("jpg", "jpeg", "png", "webp", "gif", "avif");

    private final Path directorio;
    private final String rutaPublica;

    public AlmacenamientoService(@Value("${app.uploads.dir}") String directorio,
                                 @Value("${app.uploads.public-path}") String rutaPublica) {
        this.directorio = Paths.get(directorio).toAbsolutePath().normalize();
        this.rutaPublica = rutaPublica.endsWith("/") ? rutaPublica : rutaPublica + "/";
    }

    @PostConstruct
    void prepararDirectorio() {
        try {
            Files.createDirectories(directorio);
            log.info("Las imágenes se guardan en {}", directorio);
        } catch (IOException e) {
            throw new AlmacenamientoException("No se pudo crear la carpeta de imágenes " + directorio, e);
        }
    }

    public Path getDirectorio() {
        return directorio;
    }

    /** Persiste el archivo con un nombre único y devuelve su URL pública. */
    public String guardar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("Se recibió un archivo de imagen vacío");
        }
        String extension = extensionValidada(archivo.getOriginalFilename());
        String nombreArchivo = UUID.randomUUID() + "." + extension;

        try (InputStream entrada = archivo.getInputStream()) {
            Files.copy(entrada, directorio.resolve(nombreArchivo), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new AlmacenamientoException("No se pudo guardar la imagen " + nombreArchivo, e);
        }
        return rutaPublica + nombreArchivo;
    }

    /** Escribe bytes ya generados en memoria (lo usa la carga inicial de datos de ejemplo). */
    public String guardarBytes(byte[] contenido, String extension) {
        String nombreArchivo = UUID.randomUUID() + "." + extension;
        try {
            Files.write(directorio.resolve(nombreArchivo), contenido);
        } catch (IOException e) {
            throw new AlmacenamientoException("No se pudo guardar la imagen " + nombreArchivo, e);
        }
        return rutaPublica + nombreArchivo;
    }

    /**
     * Borra el archivo asociado a una URL pública. Un fallo acá no debe tumbar la operación
     * de negocio (el producto igual se elimina), así que sólo se registra en el log.
     */
    public void eliminar(String url) {
        if (url == null || !url.startsWith(rutaPublica)) {
            return;
        }
        String nombreArchivo = url.substring(rutaPublica.length());
        // Defensa ante rutas manipuladas: el archivo resuelto debe seguir dentro del directorio.
        Path destino = directorio.resolve(nombreArchivo).normalize();
        if (!destino.startsWith(directorio)) {
            log.warn("Se ignoró una ruta de imagen fuera del directorio de subidas: {}", url);
            return;
        }
        try {
            Files.deleteIfExists(destino);
        } catch (IOException e) {
            log.warn("No se pudo borrar el archivo {}: {}", destino, e.getMessage());
        }
    }

    private String extensionValidada(String nombreOriginal) {
        String extension = StringUtils.getFilenameExtension(nombreOriginal);
        if (extension == null) {
            throw new IllegalArgumentException("El archivo no tiene extensión y no se puede identificar como imagen");
        }
        extension = extension.toLowerCase(Locale.ROOT);
        if (!EXTENSIONES_PERMITIDAS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Formato de imagen no permitido: ." + extension + ". Se aceptan: " + String.join(", ", EXTENSIONES_PERMITIDAS));
        }
        return extension;
    }
}
