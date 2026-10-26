package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Ciudad;

public record CiudadResponse(Long id, String nombre, String pais) {

    public static CiudadResponse desde(Ciudad ciudad) {
        if (ciudad == null) {
            return null;
        }
        return new CiudadResponse(ciudad.getId(), ciudad.getNombre(), ciudad.getPais());
    }
}
