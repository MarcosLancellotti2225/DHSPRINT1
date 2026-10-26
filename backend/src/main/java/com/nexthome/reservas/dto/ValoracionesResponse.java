package com.nexthome.reservas.dto;

import java.util.List;

/**
 * Las reseñas de un alojamiento con su resumen.
 *
 * {@code puedePuntuar} y {@code miValoracion} dependen de quién pregunta: sólo
 * puntúa quien ya terminó una estadía, y si ya puntuó se le muestra lo que puso.
 */
public record ValoracionesResponse(
        double promedio,
        long cantidad,
        boolean puedePuntuar,
        ValoracionResponse miValoracion,
        List<ValoracionResponse> resenias) {
}
