package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.DisponibilidadResponse;
import com.nexthome.reservas.dto.ReservaRequest;
import com.nexthome.reservas.dto.ReservaResponse;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService service;

    public ReservaController(ReservaService service) {
        this.service = service;
    }

    /** Público: cualquiera puede ver qué fechas están ocupadas antes de decidirse. */
    @GetMapping("/disponibilidad/{productoId}")
    public DisponibilidadResponse disponibilidad(@PathVariable Long productoId) {
        return service.disponibilidad(productoId);
    }

    /** Reservar exige sesión iniciada: la estadía queda a nombre de alguien. */
    @PostMapping
    public ResponseEntity<ReservaResponse> crear(@Valid @RequestBody ReservaRequest request,
                                                 @AuthenticationPrincipal Usuario usuario) {
        ReservaResponse creada = service.crear(request, usuario);
        return ResponseEntity.created(URI.create("/api/reservas/" + creada.id())).body(creada);
    }

    @GetMapping("/mias")
    public List<ReservaResponse> mias(@AuthenticationPrincipal Usuario usuario) {
        return service.listarDelUsuario(usuario);
    }
}
