package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Valoracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ValoracionRepository extends JpaRepository<Valoracion, Long> {

    Optional<Valoracion> findByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    /** Reseñas de un alojamiento, de la más nueva a la más vieja. */
    @Query("""
            select v from Valoracion v
            join fetch v.usuario
            where v.producto.id = :productoId
            order by v.publicadaEn desc
            """)
    List<Valoracion> buscarDelProducto(Long productoId);

    @Query("select avg(v.estrellas) from Valoracion v where v.producto.id = :productoId")
    Double promedioDe(Long productoId);

    long countByProductoId(Long productoId);

    /** Promedio y cantidad de varios alojamientos de una, para el listado. */
    @Query("""
            select v.producto.id, avg(v.estrellas), count(v)
            from Valoracion v
            where v.producto.id in :productoIds
            group by v.producto.id
            """)
    List<Object[]> resumenDe(List<Long> productoIds);

    @Modifying
    @Query("delete from Valoracion v where v.producto.id = :productoId")
    int eliminarPorProducto(Long productoId);
}
