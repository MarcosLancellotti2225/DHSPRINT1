package com.nexthome.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Datos del formulario de alta de producto (multipart/form-data). */
public class ProductoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String nombre;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 4000, message = "La descripción no puede superar los 4000 caracteres")
    private String descripcion;

    /** Opcional: un producto puede quedar sin categoría. */
    /** Opcional: un producto puede no tener ciudad asignada. */
    private Long ciudadId;

    private Long categoriaId;

    /** Opcional: ids de las características asociadas al producto. */
    private List<Long> caracteristicaIds;

    @NotEmpty(message = "Se debe cargar al menos una imagen")
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

    public Long getCiudadId() {
        return ciudadId;
    }

    public void setCiudadId(Long ciudadId) {
        this.ciudadId = ciudadId;
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
