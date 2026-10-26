package com.nexthome.reservas.exception;

/** El alojamiento ya está reservado en esas fechas. Se traduce a HTTP 409. */
public class SinDisponibilidadException extends RuntimeException {

    public SinDisponibilidadException() {
        super("El alojamiento ya está reservado en esas fechas. Probá con otro rango.");
    }
}
