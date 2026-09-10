package com.nexthome.reservas.security;

import com.nexthome.reservas.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Emite y valida los JWT firmados con HMAC-SHA256 que usa la API.
 *
 * No hay sesión de servidor: el frontend es una SPA aparte y manda el token en
 * cada request dentro del header {@code Authorization: Bearer ...}.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    /** Nombre del claim donde viaja el rol, para no tener que ir a la base en cada request. */
    static final String CLAIM_ROL = "rol";

    private final SecretKey clave;
    private final Duration duracion;

    public JwtService(@Value("${app.jwt.secret}") String secreto,
                      @Value("${app.jwt.expiration-minutes}") long minutos) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            // HMAC-SHA256 pide al menos 256 bits de clave; con menos, jjwt falla al firmar.
            throw new IllegalStateException(
                    "app.jwt.secret debe tener al menos 32 caracteres para poder firmar con HS256");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.duracion = Duration.ofMinutes(minutos);
    }

    public String generar(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim(CLAIM_ROL, usuario.getRol().name())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(duracion)))
                .signWith(clave)
                .compact();
    }

    /** Devuelve el email del token, o vacío si está vencido, adulterado o mal formado. */
    public Optional<String> emailDeToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(clave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.ofNullable(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token rechazado: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public long getDuracionEnSegundos() {
        return duracion.toSeconds();
    }
}
