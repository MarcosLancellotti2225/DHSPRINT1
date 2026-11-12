package com.nexthome.reservas.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Datos del formulario de alta de producto (multipart/form-data). */
public class ProductoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 5, max = 150, message = "El nombre tiene que tener entre 5 y 150 caracteres")
    private String nombre;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(min = 20, max = 4000, message = "La descripción tiene que tener entre 20 y 4000 caracteres")
    private String descripcion;

    /** Cuántos huéspedes entran. El buscador filtra por esto. */
    @NotNull(message = "La capacidad es obligatoria")
    @Min(value = 1, message = "Tiene que entrar al menos un huésped")
    @Max(value = 20, message = "La capacidad no puede superar los 20 huéspedes")
    private Integer capacidad;

    /** Precio por noche. Es por lo que ordena y filtra el buscador. */
    @NotNull(message = "El precio por noche es obligatorio")
    @DecimalMin(value = "1.00", message = "El precio por noche tiene que ser mayor a cero")
    @DecimalMax(value = "99999999.99", message = "El precio por noche es demasiado alto")
    private BigDecimal precioPorNoche;

    /** Sin ciudad el alojamiento no aparece en ninguna búsqueda por destino. */
    @NotNull(message = "La ciudad es obligatoria")
    private Long ciudadId;

    /** Sin categoría el alojamiento queda fuera del filtro del home. */
    @NotNull(message = "La categoría es obligatoria")
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

    public Integer getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Integer capacidad) {
        this.capacidad = capacidad;
    }

    public BigDecimal getPrecioPorNoche() {
        return precioPorNoche;
    }

    public void setPrecioPorNoche(BigDecimal precioPorNoche) {
        this.precioPorNoche = precioPorNoche;
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
