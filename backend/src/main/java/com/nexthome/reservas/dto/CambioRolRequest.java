package com.nexthome.reservas.dto;

import jakarta.validation.constraints.NotNull;

/** Otorga o quita permisos de administrador a un usuario. */
public record CambioRolRequest(
        @NotNull(message = "Hay que indicar si el usuario es administrador")
        Boolean administrador) {
}
