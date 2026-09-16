package com.nexthome.reservas.exception;

/** Ya existe otro registro con el mismo nombre. Se traduce a HTTP 409. */
public class NombreDuplicadoException extends RuntimeException {

    private NombreDuplicadoException(String mensaje) {
        super(mensaje);
    }

    public static NombreDuplicadoException deProducto(String nombre) {
        return new NombreDuplicadoException("El nombre \"" + nombre + "\" ya está en uso por otro producto");
    }

    public static NombreDuplicadoException deCategoria(String titulo) {
        return new NombreDuplicadoException("El título \"" + titulo + "\" ya está en uso por otra categoría");
    }

    public static NombreDuplicadoException deCaracteristica(String nombre) {
        return new NombreDuplicadoException("El nombre \"" + nombre + "\" ya está en uso por otra característica");
    }
}
