package com.nexthome.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Datos del formulario de edición de producto (multipart/form-data).
 *
 * A diferencia del alta, las imágenes son opcionales: si no se manda ninguna se
 * conservan las que ya tenía el producto, y si se mandan reemplazan a las anteriores.
 */
public class ProductoEdicionRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String nombre;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 4000, message = "La descripción no puede superar los 4000 caracteres")
    private String descripcion;

    private Long categoriaId;

    private List<Long> caracteristicaIds;

    private List<MultipartFile> imagenes;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }

    public List<Long> getCaracteristicaIds() {
        return caracteristicaIds;
    }

    public void setCaracteristicaIds(List<Long> caracteristicaIds) {
        this.caracteristicaIds = caracteristicaIds;
    }

    public List<MultipartFile> getImagenes() {
        return imagenes;
    }

    public void setImagenes(List<MultipartFile> imagenes) {
        this.imagenes = imagenes;
    }
}
