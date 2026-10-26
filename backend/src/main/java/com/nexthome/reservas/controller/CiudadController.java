package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.CiudadResponse;
import com.nexthome.reservas.repository.CiudadRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Destinos disponibles para el buscador del home. Sólo lectura y público. */
@RestController
@RequestMapping("/api/ciudades")
public class CiudadController {

    private final CiudadRepository repository;

    public CiudadController(CiudadRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CiudadResponse> listar() {
        return repository.findAllByOrderByNombreAsc().stream()
                .map(CiudadResponse::desde)
                .toList();
    }
}
