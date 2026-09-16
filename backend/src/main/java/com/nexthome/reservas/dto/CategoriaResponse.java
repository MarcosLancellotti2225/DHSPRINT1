package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Categoria;

public record CategoriaResponse(Long id, String titulo, String descripcion, String imagen) {

    public static CategoriaResponse desde(Categoria categoria) {
        if (categoria == null) {
            return null;
        }
        return new CategoriaResponse(
                categoria.getId(), categoria.getTitulo(), categoria.getDescripcion(), categoria.getImagen());
    }
}
