package com.nexthome.reservas.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ValoracionRequest(
        @NotNull(message = "Hay que elegir una puntuación")
        @Min(value = 1, message = "La puntuación mínima es de 1 estrella")
        @Max(value = 5, message = "La puntuación máxima es de 5 estrellas")
        Integer estrellas,

        @Size(max = 2000, message = "El comentario no puede superar los 2000 caracteres")
        String comentario) {
}
