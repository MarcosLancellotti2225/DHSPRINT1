package com.nexthome.reservas.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Qué fechas están ocupadas en un alojamiento. Cada tramo es un rango semiabierto:
 * la noche de {@code salida} ya está libre.
 */
public record DisponibilidadResponse(Long productoId, List<TramoOcupado> ocupadas) {

    public record TramoOcupado(LocalDate entrada, LocalDate salida) {
    }
}
