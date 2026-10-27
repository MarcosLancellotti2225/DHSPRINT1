package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Categoria;

public record CategoriaResponse(
        Long id, String titulo, String descripcion, String imagen, long alojamientos) {

    public static CategoriaResponse desde(Categoria categoria) {
        return desde(categoria, 0);
    }

    /** Con la cantidad de alojamientos que la usan, para avisar antes de borrarla. */
    public static CategoriaResponse desde(Categoria categoria, long alojamientos) {
        if (categoria == null) {
            return null;
        }
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getTitulo(),
                categoria.getDescripcion(),
                categoria.getImagen(),
                alojamientos);
    }
}
