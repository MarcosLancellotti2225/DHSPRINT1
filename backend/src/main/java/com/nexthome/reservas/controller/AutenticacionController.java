package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.AutenticacionResponse;
import com.nexthome.reservas.dto.LoginRequest;
import com.nexthome.reservas.dto.RegistroRequest;
import com.nexthome.reservas.dto.UsuarioResponse;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.service.AutenticacionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AutenticacionController {

    private final AutenticacionService service;

    public AutenticacionController(AutenticacionService service) {
        this.service = service;
    }

    @PostMapping("/registro")
    public ResponseEntity<AutenticacionResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(request));
    }

    @PostMapping("/login")
    public AutenticacionResponse iniciarSesion(@Valid @RequestBody LoginRequest request) {
        return service.iniciarSesion(request);
    }

    /** Con este endpoint el frontend revalida el token guardado al recargar la página. */
    @GetMapping("/perfil")
    public UsuarioResponse perfil(@AuthenticationPrincipal Usuario usuario) {
        return UsuarioResponse.desde(usuario);
    }
}
