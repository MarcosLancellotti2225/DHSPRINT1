package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.FavoritoResponse;
import com.nexthome.reservas.dto.ProductoResponse;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.service.FavoritoService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Favoritos del usuario identificado. Todo /api/favoritos exige sesión iniciada:
 * los favoritos son de cada cuenta y nunca se comparten entre usuarios.
 */
@RestController
@RequestMapping("/api/favoritos")
public class FavoritoController {

    private final FavoritoService service;

    public FavoritoController(FavoritoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductoResponse> listar(@AuthenticationPrincipal Usuario usuario) {
        return service.listar(usuario);
    }

    /** PUT y no POST: marcar dos veces deja el mismo estado. */
    @PutMapping("/{productoId}")
    public FavoritoResponse marcar(@PathVariable Long productoId,
                                   @AuthenticationPrincipal Usuario usuario) {
        return service.marcar(productoId, usuario);
    }

    @DeleteMapping("/{productoId}")
    public FavoritoResponse desmarcar(@PathVariable Long productoId,
                                      @AuthenticationPrincipal Usuario usuario) {
        return service.desmarcar(productoId, usuario);
    }
}
