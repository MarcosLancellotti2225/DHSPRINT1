package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    @Query("select p.id from Producto p")
    List<Long> buscarTodosLosIds();

    /**
     * Trae los productos con sus imágenes en una sola consulta para evitar N+1.
     * El {@code distinct} es necesario porque el join a la colección duplica filas.
     */
    @Query("select distinct p from Producto p left join fetch p.imagenes where p.id in :ids")
    List<Producto> buscarPorIdsConImagenes(List<Long> ids);

    /**
     * Segunda pasada sobre los mismos productos para traer categoría y características.
     * Va en una consulta aparte a propósito: hacer {@code fetch} de dos colecciones en
     * la misma query genera un producto cartesiano. Como corre dentro de la misma
     * transacción, Hibernate completa las entidades que ya tiene en el contexto.
     */
    @Query("select distinct p from Producto p left join fetch p.caracteristicas left join fetch p.categoria left join fetch p.ciudad where p.id in :ids")
    List<Producto> buscarPorIdsConCaracteristicas(List<Long> ids);

    @Query("select p from Producto p left join fetch p.imagenes where p.id = :id")
    Optional<Producto> buscarPorIdConImagenes(Long id);

    /**
     * Página de ids: paginar directamente sobre la entidad con {@code join fetch} obliga
     * a Hibernate a paginar en memoria, así que primero se pagina el id y después se
     * hidratan las imágenes.
     */
    @Query(value = "select p.id from Producto p", countQuery = "select count(p) from Producto p")
    Page<Long> buscarPaginaDeIds(Pageable pageable);

    /**
     * Misma paginación, acotada por ciudad, por categorías y por disponibilidad en un
     * rango de fechas. Los tres filtros son opcionales: con {@code ciudadId} en null o
     * las banderas en true, esa condición no se aplica. Van como banderas y no como
     * consultas separadas porque un {@code in} con lista vacía no existe en JPQL, y con
     * tres filtros harían falta ocho consultas casi iguales.
     */
    @Query(value = """
            select p.id from Producto p
            where (:ciudadId is null or p.ciudad.id = :ciudadId)
              and (:sinFiltroDeCategorias = true or p.categoria.id in :categoriaIds)
              and (:sinFiltroDeFechas = true or p.id not in :ocupadosIds)
            """,
            countQuery = """
            select count(p) from Producto p
            where (:ciudadId is null or p.ciudad.id = :ciudadId)
              and (:sinFiltroDeCategorias = true or p.categoria.id in :categoriaIds)
              and (:sinFiltroDeFechas = true or p.id not in :ocupadosIds)
            """)
    Page<Long> buscarPagina(Long ciudadId, boolean sinFiltroDeCategorias, List<Long> categoriaIds,
                            boolean sinFiltroDeFechas, List<Long> ocupadosIds,
                            Pageable pageable);

    long countByCiudadId(Long ciudadId);

    /** Deja sin categoría a los productos que apuntaban a la que se está eliminando. */
    @Modifying
    @Query("update Producto p set p.categoria = null where p.categoria.id = :categoriaId")
    int desasignarCategoria(Long categoriaId);

    @Query("select p from Producto p join p.caracteristicas c where c.id = :caracteristicaId")
    List<Producto> buscarPorCaracteristica(Long caracteristicaId);
}
