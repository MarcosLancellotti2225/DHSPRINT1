package com.nexthome.reservas.exception;

/**
 * Login fallido. Se traduce a HTTP 401 con un mensaje genérico: nunca se aclara si
 * el que falló fue el email o la contraseña, para no filtrar qué cuentas existen.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException() {
        super("El email o la contraseña no son correctos");
    }
}
