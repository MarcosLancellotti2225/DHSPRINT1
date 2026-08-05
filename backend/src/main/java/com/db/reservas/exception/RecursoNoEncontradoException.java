package com.db.reservas.exception;

/** Se lanza cuando no existe el recurso pedido. Se traduce a HTTP 404. */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
