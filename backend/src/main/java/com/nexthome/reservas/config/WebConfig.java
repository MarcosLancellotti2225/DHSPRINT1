package com.nexthome.reservas.config;

import com.nexthome.reservas.service.AlmacenamientoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AlmacenamientoService almacenamiento;
    private final String rutaPublica;

    public WebConfig(AlmacenamientoService almacenamiento,
                     @Value("${app.uploads.public-path}") String rutaPublica) {
        this.almacenamiento = almacenamiento;
        this.rutaPublica = rutaPublica;
    }

    /** Expone la carpeta local de subidas como recurso estático. */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(rutaPublica + "/**")
                .addResourceLocations(almacenamiento.getDirectorio().toUri().toString());
    }
}
