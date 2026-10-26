package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Reservas de un alojamiento que pisan el rango pedido. El solapamiento se
     * evalúa con el rango semiabierto: la fecha de salida de una reserva puede ser
     * la de entrada de la siguiente.
     */
    @Query("""
            select r from Reserva r
            where r.producto.id = :productoId
              and r.entrada < :salida
              and r.salida > :entrada
            """)
    List<Reserva> buscarSuperpuestas(Long productoId, LocalDate entrada, LocalDate salida);

    /** Reservas futuras y en curso de un alojamiento, para pintar el calendario. */
    @Query("select r from Reserva r where r.producto.id = :productoId and r.salida >= :desde order by r.entrada asc")
    List<Reserva> buscarDesde(Long productoId, LocalDate desde);

    /** Ids de los alojamientos ocupados en el rango, para descartarlos de la búsqueda. */
    @Query("""
            select distinct r.producto.id from Reserva r
            where r.entrada < :salida
              and r.salida > :entrada
            """)
    List<Long> buscarIdsOcupados(LocalDate entrada, LocalDate salida);

    @Query("select r from Reserva r where r.usuario.id = :usuarioId order by r.entrada desc")
    List<Reserva> buscarDelUsuario(Long usuarioId);

    /** ¿Este usuario ya terminó una estadía en este alojamiento? Habilita puntuarlo. */
    @Query("""
            select count(r) > 0 from Reserva r
            where r.usuario.id = :usuarioId
              and r.producto.id = :productoId
              and r.salida < :hoy
            """)
    boolean finalizoUnaEstadia(Long usuarioId, Long productoId, LocalDate hoy);

    @Modifying
    @Query("delete from Reserva r where r.producto.id = :productoId")
    int eliminarPorProducto(Long productoId);
}
