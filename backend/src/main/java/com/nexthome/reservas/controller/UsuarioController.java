package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.CambioRolRequest;
import com.nexthome.reservas.dto.UsuarioResponse;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Administración de usuarios. La cadena de seguridad exige rol ADMIN en todo /api/usuarios. */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return service.listar();
    }

    @PatchMapping("/{id}/rol")
    public UsuarioResponse cambiarRol(@PathVariable Long id,
                                      @Valid @RequestBody CambioRolRequest request,
                                      @AuthenticationPrincipal Usuario quienEjecuta) {
        return service.cambiarRol(id, request.administrador(), quienEjecuta);
    }
}
