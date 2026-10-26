package com.nexthome.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Puntuación con estrellas y reseña que deja un huésped sobre un alojamiento.
 *
 * Un usuario deja una sola valoración por alojamiento: si vuelve a puntuarlo,
 * actualiza la que ya tenía en lugar de sumar otra.
 */
@Entity
@Table(
        name = "valoraciones",
        uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "producto_id"}))
public class Valoracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** De 1 a 5 estrellas. */
    @Column(nullable = false)
    private int estrellas;

    /** El comentario es opcional: se puede puntuar sin escribir nada. */
    @Column(length = 2000)
    private String comentario;

    @Column(nullable = false)
    private Instant publicadaEn = Instant.now();

    public Valoracion() {
    }

    public Valoracion(Producto producto, Usuario usuario, int estrellas, String comentario) {
        this.producto = producto;
        this.usuario = usuario;
        this.estrellas = estrellas;
        this.comentario = comentario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public int getEstrellas() {
        return estrellas;
    }

    public void setEstrellas(int estrellas) {
        this.estrellas = estrellas;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public Instant getPublicadaEn() {
        return publicadaEn;
    }

    public void setPublicadaEn(Instant publicadaEn) {
        this.publicadaEn = publicadaEn;
    }
}
