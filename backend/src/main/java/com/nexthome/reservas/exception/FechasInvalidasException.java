package com.nexthome.reservas.exception;

/** El rango de fechas pedido no tiene sentido. Se traduce a HTTP 400. */
public class FechasInvalidasException extends RuntimeException {

    public FechasInvalidasException(String mensaje) {
        super(mensaje);
    }
}
