package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Caracteristica;

public record CaracteristicaResponse(Long id, String nombre, String icono) {

    public static CaracteristicaResponse desde(Caracteristica caracteristica) {
        return new CaracteristicaResponse(
                caracteristica.getId(), caracteristica.getNombre(), caracteristica.getIcono());
    }
}
