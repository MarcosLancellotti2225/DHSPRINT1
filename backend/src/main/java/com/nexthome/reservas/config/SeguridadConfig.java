package com.nexthome.reservas.config;

import com.nexthome.reservas.security.FiltroAutenticacionJwt;
import com.nexthome.reservas.security.ManejadorAccesoDenegado;
import com.nexthome.reservas.security.PuntoDeEntradaNoAutenticado;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Reglas de acceso de la API.
 *
 * La autenticación es por JWT y sin estado: no se crea sesión de servidor, así que
 * tampoco hace falta CSRF. Lo que se puede hacer sin identificarse es exactamente lo
 * que ve un visitante del sitio; todo lo que escribe el catálogo exige rol de
 * administrador, validado acá y no sólo escondiendo botones en el frontend.
 */
@Configuration
@EnableWebSecurity
public class SeguridadConfig {

    private final FiltroAutenticacionJwt filtroJwt;
    private final PuntoDeEntradaNoAutenticado puntoDeEntrada;
    private final ManejadorAccesoDenegado accesoDenegado;
    private final String rutaPublicaImagenes;
    private final List<String> origenesPermitidos;

    public SeguridadConfig(FiltroAutenticacionJwt filtroJwt,
                           PuntoDeEntradaNoAutenticado puntoDeEntrada,
                           ManejadorAccesoDenegado accesoDenegado,
                           @Value("${app.uploads.public-path}") String rutaPublicaImagenes,
                           @Value("${app.cors.allowed-origins}") List<String> origenesPermitidos) {
        this.filtroJwt = filtroJwt;
        this.puntoDeEntrada = puntoDeEntrada;
        this.accesoDenegado = accesoDenegado;
        this.rutaPublicaImagenes = rutaPublicaImagenes;
        this.origenesPermitidos = origenesPermitidos;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain cadenaDeSeguridad(HttpSecurity http) throws Exception {
        String patronImagenes = rutaPublicaImagenes + "/**";

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(configuracionCors()))
                .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // La consola de H2 se dibuja dentro de un iframe del mismo origen.
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .exceptionHandling(manejo -> manejo
                        .authenticationEntryPoint(puntoDeEntrada)
                        .accessDeniedHandler(accesoDenegado))
                .authorizeHttpRequests(reglas -> reglas
                        // --- Público ---------------------------------------------------
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.GET, patronImagenes).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/registro", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/productos/**", "/api/categorias/**", "/api/caracteristicas/**").permitAll()

                        // --- Sólo administradores --------------------------------------
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST,
                                "/api/productos/**", "/api/categorias/**", "/api/caracteristicas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/productos/**", "/api/categorias/**", "/api/caracteristicas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/productos/**", "/api/categorias/**", "/api/caracteristicas/**").hasRole("ADMIN")

                        // --- Resto: hay que estar identificado -------------------------
                        .anyRequest().authenticated())
                .addFilterBefore(filtroJwt, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Una única definición de CORS para toda la aplicación. Como el filtro de seguridad
     * corre antes que Spring MVC, es acá donde tiene que estar.
     */
    @Bean
    public CorsConfigurationSource configuracionCors() {
        CorsConfiguration api = new CorsConfiguration();
        api.setAllowedOrigins(origenesPermitidos);
        api.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        api.setAllowedHeaders(List.of("*"));
        api.setMaxAge(3600L);

        CorsConfiguration imagenes = new CorsConfiguration();
        imagenes.setAllowedOrigins(origenesPermitidos);
        imagenes.setAllowedMethods(List.of("GET"));
        imagenes.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/api/**", api);
        fuente.registerCorsConfiguration(rutaPublicaImagenes + "/**", imagenes);
        return fuente;
    }
}
