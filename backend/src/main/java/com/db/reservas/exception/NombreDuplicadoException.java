package com.db.reservas.exception;

/** Se lanza cuando ya existe un producto con el mismo nombre. Se traduce a HTTP 409. */
public class NombreDuplicadoException extends RuntimeException {

    public NombreDuplicadoException(String nombre) {
        super("El nombre \"" + nombre + "\" ya está en uso por otro producto");
    }
}
