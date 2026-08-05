package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    @Query("select p.id from Producto p")
    List<Long> buscarTodosLosIds();

    /**
     * Trae los productos con sus imágenes en una sola consulta para evitar N+1.
     * El {@code distinct} es necesario porque el join a la colección duplica filas.
     */
    @Query("select distinct p from Producto p left join fetch p.imagenes where p.id in :ids")
    List<Producto> buscarPorIdsConImagenes(List<Long> ids);

    @Query("select p from Producto p left join fetch p.imagenes where p.id = :id")
    Optional<Producto> buscarPorIdConImagenes(Long id);

    /**
     * Página de ids: paginar directamente sobre la entidad con {@code join fetch} obliga
     * a Hibernate a paginar en memoria, así que primero se pagina el id y después se
     * hidratan las imágenes.
     */
    @Query(value = "select p.id from Producto p", countQuery = "select count(p) from Producto p")
    Page<Long> buscarPaginaDeIds(Pageable pageable);
}
