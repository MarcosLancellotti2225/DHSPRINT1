package com.nexthome.reservas.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReservaRequest(
        @NotNull(message = "Hay que elegir el alojamiento")
        Long productoId,

        @NotNull(message = "La fecha de check-in es obligatoria")
        @FutureOrPresent(message = "El check-in no puede ser una fecha pasada")
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate entrada,

        @NotNull(message = "La fecha de check-out es obligatoria")
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate salida,

        @NotNull(message = "Hay que indicar cuántos huéspedes son")
        @Min(value = 1, message = "Tiene que haber al menos un huésped")
        @Max(value = 20, message = "No se aceptan más de 20 huéspedes")
        Integer huespedes) {
}
