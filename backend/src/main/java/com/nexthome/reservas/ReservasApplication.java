package com.nexthome.reservas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * La autenticación es por JWT contra la tabla de usuarios. Sin esta exclusión Spring Boot
 * crea además un usuario en memoria con una contraseña aleatoria que nadie usa y que
 * igual se imprime en el log.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class ReservasApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReservasApplication.class, args);
    }
}
