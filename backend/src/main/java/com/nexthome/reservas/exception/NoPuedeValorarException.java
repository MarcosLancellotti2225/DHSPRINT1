package com.nexthome.reservas.exception;

/**
 * Sólo puntúa quien ya se alojó. Se traduce a HTTP 403: el usuario está
 * identificado, pero no cumple la condición para esta acción.
 */
public class NoPuedeValorarException extends RuntimeException {

    public NoPuedeValorarException() {
        super("Sólo podés puntuar un alojamiento en el que ya te hayas hospedado");
    }
}
