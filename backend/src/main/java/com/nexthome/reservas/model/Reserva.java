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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Estadía reservada por un usuario en un alojamiento.
 *
 * El rango es semiabierto: {@code entrada} es la primera noche ocupada y
 * {@code salida} es el día en que el huésped se va, así que esa fecha queda libre
 * para que entre otro. Por eso dos reservas se superponen sólo cuando
 * {@code entrada < otra.salida && salida > otra.entrada}.
 */
@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDate entrada;

    @Column(nullable = false)
    private LocalDate salida;

    @Column(nullable = false)
    private int huespedes;

    /**
     * Precio por noche al momento de reservar. Se copia y no se lee del producto porque
     * si mañana se cambia la tarifa, el total de una reserva ya hecha no debe moverse.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioPorNoche = BigDecimal.ZERO;

    @Column(nullable = false)
    private Instant creadaEn = Instant.now();

    public Reserva() {
    }

    public Reserva(Producto producto, Usuario usuario, LocalDate entrada, LocalDate salida, int huespedes) {
        this.producto = producto;
        this.usuario = usuario;
        this.entrada = entrada;
        this.salida = salida;
        this.huespedes = huespedes;
        // La tarifa se copia acá: a partir de ahora la reserva vale lo que valía al
        // momento de hacerla, sin importar lo que pase después con el precio del producto.
        this.precioPorNoche = producto.getPrecioPorNoche();
    }

    /** Una estadía está terminada cuando ya pasó su fecha de salida. */
    public boolean estaFinalizada() {
        return salida.isBefore(LocalDate.now());
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

    public LocalDate getEntrada() {
        return entrada;
    }

    public void setEntrada(LocalDate entrada) {
        this.entrada = entrada;
    }

    public LocalDate getSalida() {
        return salida;
    }

    public void setSalida(LocalDate salida) {
        this.salida = salida;
    }

    public int getHuespedes() {
        return huespedes;
    }

    public BigDecimal getPrecioPorNoche() {
        return precioPorNoche;
    }

    public void setPrecioPorNoche(BigDecimal precioPorNoche) {
        this.precioPorNoche = precioPorNoche;
    }

    /** Noches de la estadía, contadas como rango media abierto. */
    public int getNoches() {
        return (int) java.time.temporal.ChronoUnit.DAYS.between(entrada, salida);
    }

    /** Lo que sale la estadía completa: la tarifa congelada por las noches. */
    public BigDecimal getTotal() {
        return precioPorNoche.multiply(BigDecimal.valueOf(getNoches()));
    }

    public void setHuespedes(int huespedes) {
        this.huespedes = huespedes;
    }

    public Instant getCreadaEn() {
        return creadaEn;
    }

    public void setCreadaEn(Instant creadaEn) {
        this.creadaEn = creadaEn;
    }
}
