package com.db.reservas.dto;

import com.db.reservas.model.Producto;

import java.util.List;

public record ProductoResponse(Long id, String nombre, String descripcion, List<ImagenResponse> imagenes) {

    public static ProductoResponse desde(Producto producto) {
        List<ImagenResponse> imagenes = producto.getImagenes().stream()
                .map(imagen -> new ImagenResponse(imagen.getId(), imagen.getUrl()))
                .toList();
        return new ProductoResponse(producto.getId(), producto.getNombre(), producto.getDescripcion(), imagenes);
    }
}
