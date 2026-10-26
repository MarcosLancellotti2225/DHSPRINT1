package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.ValoracionRequest;
import com.nexthome.reservas.dto.ValoracionResponse;
import com.nexthome.reservas.dto.ValoracionesResponse;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.service.ValoracionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/productos/{productoId}/valoraciones")
public class ValoracionController {

    private final ValoracionService service;

    public ValoracionController(ValoracionService service) {
        this.service = service;
    }

    /**
     * Las reseñas son públicas. Si además hay sesión, la respuesta dice si esa
     * persona puede puntuar y qué había puntuado antes.
     */
    @GetMapping
    public ValoracionesResponse listar(@PathVariable Long productoId,
                                       @AuthenticationPrincipal Usuario usuario) {
        return service.listar(productoId, usuario);
    }

    @PostMapping
    public ValoracionResponse valorar(@PathVariable Long productoId,
                                      @Valid @RequestBody ValoracionRequest request,
                                      @AuthenticationPrincipal Usuario usuario) {
        return service.valorar(productoId, request, usuario);
    }
}
