package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Reserva;

import java.time.LocalDate;

public record ReservaResponse(
        Long id,
        Long productoId,
        String producto,
        LocalDate entrada,
        LocalDate salida,
        int huespedes,
        int noches,
        boolean finalizada) {

    public static ReservaResponse desde(Reserva reserva) {
        return new ReservaResponse(
                reserva.getId(),
                reserva.getProducto().getId(),
                reserva.getProducto().getNombre(),
                reserva.getEntrada(),
                reserva.getSalida(),
                reserva.getHuespedes(),
                (int) java.time.temporal.ChronoUnit.DAYS.between(reserva.getEntrada(), reserva.getSalida()),
                reserva.estaFinalizada());
    }
}
