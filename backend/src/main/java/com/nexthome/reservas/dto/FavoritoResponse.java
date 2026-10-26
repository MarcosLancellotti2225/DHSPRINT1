package com.nexthome.reservas.dto;

/** Resultado de marcar o desmarcar un favorito. */
public record FavoritoResponse(Long productoId, boolean favorito) {
}
