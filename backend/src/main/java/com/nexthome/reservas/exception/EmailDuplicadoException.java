package com.nexthome.reservas.exception;

/** Ya hay una cuenta registrada con ese email. Se traduce a HTTP 409. */
public class EmailDuplicadoException extends RuntimeException {

    public EmailDuplicadoException(String email) {
        super("Ya existe una cuenta registrada con el email " + email);
    }
}
