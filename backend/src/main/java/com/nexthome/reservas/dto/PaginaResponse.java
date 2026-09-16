package com.nexthome.reservas.dto;

import java.util.List;

/**
 * Envoltorio de paginación propio, para no exponer la serialización de {@code Page} de Spring.
 *
 * {@code totalElementos} cuenta lo que entra en el filtro aplicado y {@code totalSinFiltro}
 * el catálogo completo: el listado necesita los dos para mostrar "X de Y alojamientos".
 */
public record PaginaResponse<T>(
        List<T> contenido,
        int pagina,
        int tamanio,
        long totalElementos,
        long totalSinFiltro,
        int totalPaginas,
        boolean primera,
        boolean ultima) {

    public static <T> PaginaResponse<T> de(
            List<T> contenido, int pagina, int tamanio, long totalElementos, long totalSinFiltro) {
        int totalPaginas = tamanio > 0 ? (int) Math.ceil((double) totalElementos / tamanio) : 0;
        return new PaginaResponse<>(
                contenido,
                pagina,
                tamanio,
                totalElementos,
                totalSinFiltro,
                totalPaginas,
                pagina == 0,
                totalPaginas == 0 || pagina >= totalPaginas - 1);
    }
}
