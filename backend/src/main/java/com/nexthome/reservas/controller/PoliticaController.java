package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.PoliticaResponse;
import com.nexthome.reservas.repository.PoliticaRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Políticas de uso que se muestran en el detalle de cada alojamiento. Público. */
@RestController
@RequestMapping("/api/politicas")
public class PoliticaController {

    private final PoliticaRepository repository;

    public PoliticaController(PoliticaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PoliticaResponse> listar() {
        return repository.findAllByOrderByOrdenAsc().stream()
                .map(PoliticaResponse::desde)
                .toList();
    }
}
