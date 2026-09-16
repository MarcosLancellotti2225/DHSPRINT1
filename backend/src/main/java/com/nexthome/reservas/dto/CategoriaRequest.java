package com.nexthome.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Alta y edición de categorías (JSON). */
public record CategoriaRequest(
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 100, message = "El título no puede superar los 100 caracteres")
        String titulo,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres")
        String descripcion,

        @NotBlank(message = "La imagen es obligatoria")
        @Size(max = 500, message = "La URL de la imagen no puede superar los 500 caracteres")
        String imagen) {
}
