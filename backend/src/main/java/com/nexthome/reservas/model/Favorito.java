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
 * Un producto marcado como favorito por un usuario.
 *
 * Es una entidad propia y no un {@code @ManyToMany} en {@link Usuario} porque guarda
 * cuándo se marcó, que es lo que ordena la lista: primero lo último marcado.
 */
@Entity
@Table(
        name = "favoritos",
        // Un mismo usuario no puede marcar dos veces el mismo producto.
        uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "producto_id"}))
public class Favorito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Instant marcadoEn = Instant.now();

    public Favorito() {
    }

    public Favorito(Usuario usuario, Producto producto) {
        this.usuario = usuario;
        this.producto = producto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Instant getMarcadoEn() {
        return marcadoEn;
    }

    public void setMarcadoEn(Instant marcadoEn) {
        this.marcadoEn = marcadoEn;
    }
}
