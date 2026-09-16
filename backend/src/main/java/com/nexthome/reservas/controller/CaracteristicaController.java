package com.nexthome.reservas.controller;

import com.nexthome.reservas.dto.CaracteristicaRequest;
import com.nexthome.reservas.dto.CaracteristicaResponse;
import com.nexthome.reservas.service.CaracteristicaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/caracteristicas")
public class CaracteristicaController {

    private final CaracteristicaService service;

    public CaracteristicaController(CaracteristicaService service) {
        this.service = service;
    }

    @GetMapping
    public List<CaracteristicaResponse> listar() {
        return service.listar();
    }

    @PostMapping
    public ResponseEntity<CaracteristicaResponse> crear(@Valid @RequestBody CaracteristicaRequest request) {
        CaracteristicaResponse creada = service.crear(request);
        return ResponseEntity.created(URI.create("/api/caracteristicas/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    public CaracteristicaResponse actualizar(@PathVariable Long id,
                                             @Valid @RequestBody CaracteristicaRequest request) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
