package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Producto;

import java.util.Comparator;
import java.util.List;

public record ProductoResponse(
        Long id,
        String nombre,
        String descripcion,
        CiudadResponse ciudad,
        CategoriaResponse categoria,
        List<CaracteristicaResponse> caracteristicas,
        List<ImagenResponse> imagenes,
        double puntuacion,
        long valoraciones) {

    public static ProductoResponse desde(Producto producto) {
        return desde(producto, 0, 0);
    }

    public static ProductoResponse desde(Producto producto, double puntuacion, long valoraciones) {
        List<ImagenResponse> imagenes = producto.getImagenes().stream()
                .map(imagen -> new ImagenResponse(imagen.getId(), imagen.getUrl()))
                .toList();
        // Se ordena acá y no sólo con @OrderBy: recién guardado, el set todavía
        // conserva el orden en que se cargó y la respuesta quedaría distinta.
        List<CaracteristicaResponse> caracteristicas = producto.getCaracteristicas().stream()
                .map(CaracteristicaResponse::desde)
                .sorted(Comparator.comparing(CaracteristicaResponse::nombre))
                .toList();
        return new ProductoResponse(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                CiudadResponse.desde(producto.getCiudad()),
                CategoriaResponse.desde(producto.getCategoria()),
                caracteristicas,
                imagenes,
                puntuacion,
                valoraciones);
    }
}
