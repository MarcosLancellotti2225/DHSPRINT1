package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.AutenticacionResponse;
import com.nexthome.reservas.dto.LoginRequest;
import com.nexthome.reservas.dto.RegistroRequest;
import com.nexthome.reservas.dto.UsuarioResponse;
import com.nexthome.reservas.exception.CredencialesInvalidasException;
import com.nexthome.reservas.exception.EmailDuplicadoException;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.UsuarioRepository;
import com.nexthome.reservas.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AutenticacionService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AutenticacionService(UsuarioRepository repository, PasswordEncoder passwordEncoder,
                                JwtService jwtService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Da de alta la cuenta y devuelve al usuario ya identificado, para que no tenga
     * que volver a escribir sus datos en el login apenas se registra.
     */
    @Transactional
    public AutenticacionResponse registrar(RegistroRequest request) {
        String email = normalizar(request.email());
        if (repository.existsByEmailIgnoreCase(email)) {
            throw new EmailDuplicadoException(email);
        }

        Usuario usuario = new Usuario(
                request.nombre().trim(),
                request.apellido().trim(),
                email,
                passwordEncoder.encode(request.password()),
                Rol.USER);

        return conToken(repository.save(usuario));
    }

    /**
     * El mensaje de error es el mismo tanto si el email no existe como si la
     * contraseña no coincide: distinguirlos permitiría averiguar qué cuentas hay.
     */
    @Transactional(readOnly = true)
    public AutenticacionResponse iniciarSesion(LoginRequest request) {
        Usuario usuario = repository.findByEmailIgnoreCase(normalizar(request.email()))
                .orElseThrow(CredencialesInvalidasException::new);

        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new CredencialesInvalidasException();
        }

        return conToken(usuario);
    }

    private AutenticacionResponse conToken(Usuario usuario) {
        return new AutenticacionResponse(jwtService.generar(usuario), UsuarioResponse.desde(usuario));
    }

    private static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
