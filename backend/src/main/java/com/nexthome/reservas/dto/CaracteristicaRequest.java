package com.nexthome.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Alta y edición de características (JSON). */
public record CaracteristicaRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar los 80 caracteres")
        String nombre,

        @NotBlank(message = "El ícono es obligatorio")
        @Size(max = 40, message = "El ícono no puede superar los 40 caracteres")
        String icono) {
}
