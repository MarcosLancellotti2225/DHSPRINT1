package com.db.reservas.dto;

import java.util.List;

/** Envoltorio de paginación propio, para no exponer la serialización de {@code Page} de Spring. */
public record PaginaResponse<T>(
        List<T> contenido,
        int pagina,
        int tamanio,
        long totalElementos,
        int totalPaginas,
        boolean primera,
        boolean ultima) {

    public static <T> PaginaResponse<T> de(List<T> contenido, int pagina, int tamanio, long totalElementos) {
        int totalPaginas = tamanio > 0 ? (int) Math.ceil((double) totalElementos / tamanio) : 0;
        return new PaginaResponse<>(
                contenido,
                pagina,
                tamanio,
                totalElementos,
                totalPaginas,
                pagina == 0,
                totalPaginas == 0 || pagina >= totalPaginas - 1);
    }
}
