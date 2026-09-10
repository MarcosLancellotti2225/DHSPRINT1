package com.nexthome.reservas.dto;

/** Token JWT recién emitido junto con los datos del usuario que lo obtuvo. */
public record AutenticacionResponse(String token, UsuarioResponse usuario) {
}
