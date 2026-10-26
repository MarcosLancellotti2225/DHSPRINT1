package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Valoracion;

import java.time.Instant;

public record ValoracionResponse(
        Long id, int estrellas, String comentario, String autor, Instant publicadaEn) {

    public static ValoracionResponse desde(Valoracion valoracion) {
        var usuario = valoracion.getUsuario();
        return new ValoracionResponse(
                valoracion.getId(),
                valoracion.getEstrellas(),
                valoracion.getComentario(),
                usuario.getNombre() + " " + usuario.getApellido(),
                valoracion.getPublicadaEn());
    }
}
