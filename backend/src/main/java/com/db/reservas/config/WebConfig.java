package com.db.reservas.config;

import com.db.reservas.service.AlmacenamientoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AlmacenamientoService almacenamiento;
    private final String rutaPublica;
    private final String[] origenesPermitidos;

    public WebConfig(AlmacenamientoService almacenamiento,
                     @Value("${app.uploads.public-path}") String rutaPublica,
                     @Value("${app.cors.allowed-origins}") String[] origenesPermitidos) {
        this.almacenamiento = almacenamiento;
        this.rutaPublica = rutaPublica;
        this.origenesPermitidos = origenesPermitidos;
    }

    /** Permite que el frontend de Vite consuma la API y las imágenes. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origenesPermitidos)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);

        registry.addMapping(rutaPublica + "/**")
                .allowedOrigins(origenesPermitidos)
                .allowedMethods("GET")
                .maxAge(3600);
    }

    /** Expone la carpeta local de subidas como recurso estático. */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(rutaPublica + "/**")
                .addResourceLocations(almacenamiento.getDirectorio().toUri().toString());
    }
}
