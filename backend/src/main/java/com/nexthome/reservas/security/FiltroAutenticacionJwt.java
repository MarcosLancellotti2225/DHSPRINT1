package com.nexthome.reservas.security;

import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee el token del header {@code Authorization} y, si es válido, deja al usuario
 * autenticado en el contexto de seguridad de este request.
 *
 * Si no hay token o no sirve, el filtro no corta la cadena: simplemente sigue sin
 * autenticar y son las reglas de la cadena las que deciden si el recurso era público.
 */
@Component
public class FiltroAutenticacionJwt extends OncePerRequestFilter {

    private static final String PREFIJO_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public FiltroAutenticacionJwt(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String token = tokenDelHeader(request);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwtService.emailDeToken(token)
                    .flatMap(usuarioRepository::findByEmailIgnoreCase)
                    .ifPresent(usuario -> autenticar(usuario, request));
        }

        chain.doFilter(request, response);
    }

    private void autenticar(Usuario usuario, HttpServletRequest request) {
        // El rol se relee de la base en cada request: si un administrador le quita el
        // permiso a alguien, deja de tenerlo aunque su token siga vigente.
        var autoridades = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()));
        var autenticacion = new UsernamePasswordAuthenticationToken(usuario, null, autoridades);
        autenticacion.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(autenticacion);
    }

    private static String tokenDelHeader(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(PREFIJO_BEARER)) {
            return null;
        }
        String token = header.substring(PREFIJO_BEARER.length()).trim();
        return token.isEmpty() ? null : token;
    }
}
