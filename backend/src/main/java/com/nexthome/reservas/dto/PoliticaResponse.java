package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Politica;

public record PoliticaResponse(Long id, String titulo, String descripcion) {

    public static PoliticaResponse desde(Politica politica) {
        return new PoliticaResponse(politica.getId(), politica.getTitulo(), politica.getDescripcion());
    }
}
