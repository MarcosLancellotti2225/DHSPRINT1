package com.nexthome.reservas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Los filtros del buscador, juntos. Son siete y van siempre de a uno al servicio y al
 * repositorio: pasarlos sueltos hacía firmas de once argumentos donde es fácil cruzar
 * dos del mismo tipo sin que el compilador avise.
 *
 * <p>Todos son opcionales: en null no acotan nada.
 */
public record CriteriosDeBusqueda(
        Long ciudadId,
        List<Long> categoriaIds,
        LocalDate entrada,
        LocalDate salida,
        Integer huespedes,
        BigDecimal precioMinimo,
        BigDecimal precioMaximo,
        List<Long> caracteristicaIds) {

    /** Sin ningún filtro: el catálogo completo. */
    public static CriteriosDeBusqueda vacios() {
        return new CriteriosDeBusqueda(null, null, null, null, null, null, null, null);
    }

    /** Menos de un huésped no acota nada; se trata como si no lo hubieran pedido. */
    public Integer capacidadMinima() {
        return huespedes == null || huespedes < 1 ? null : huespedes;
    }

    public boolean sinFiltroDeCategorias() {
        return categoriaIds == null || categoriaIds.isEmpty();
    }

    public boolean sinFiltroDeCaracteristicas() {
        return caracteristicaIds == null || caracteristicaIds.isEmpty();
    }

    /**
     * Sólo se filtra por fechas con el rango completo y coherente: media fecha no
     * alcanza para saber qué está ocupado.
     */
    public boolean sinFiltroDeFechas() {
        return entrada == null || salida == null || !salida.isAfter(entrada);
    }

    public boolean sinFiltroDePrecio() {
        return precioMinimo == null && precioMaximo == null;
    }

    /** Si vinieron dados vuelta, se ordenan: el usuario quiso un rango igual. */
    public CriteriosDeBusqueda normalizado() {
        if (precioMinimo != null && precioMaximo != null && precioMinimo.compareTo(precioMaximo) > 0) {
            return new CriteriosDeBusqueda(ciudadId, categoriaIds, entrada, salida, huespedes,
                    precioMaximo, precioMinimo, caracteristicaIds);
        }
        return this;
    }

    /** True cuando no hay ningún filtro activo más allá del destino. */
    public boolean soloDestino() {
        return sinFiltroDeCategorias() && sinFiltroDeFechas() && sinFiltroDeCaracteristicas()
                && sinFiltroDePrecio() && capacidadMinima() == null;
    }
}
