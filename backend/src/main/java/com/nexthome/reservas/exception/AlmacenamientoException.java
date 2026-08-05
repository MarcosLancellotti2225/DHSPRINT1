package com.nexthome.reservas.exception;

/** Falla al guardar o eliminar un archivo de imagen. Se traduce a HTTP 500. */
public class AlmacenamientoException extends RuntimeException {

    public AlmacenamientoException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }

    public AlmacenamientoException(String mensaje) {
        super(mensaje);
    }
}
