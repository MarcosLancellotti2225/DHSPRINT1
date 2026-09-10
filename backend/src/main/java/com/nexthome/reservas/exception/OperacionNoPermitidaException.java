package com.nexthome.reservas.exception;

/**
 * La operación es válida en general pero no en este contexto, por ejemplo un
 * administrador intentando quitarse a sí mismo el permiso. Se traduce a HTTP 409.
 */
public class OperacionNoPermitidaException extends RuntimeException {

    public OperacionNoPermitidaException(String mensaje) {
        super(mensaje);
    }
}
