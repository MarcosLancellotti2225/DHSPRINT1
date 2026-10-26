package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Favorito;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;

public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    Optional<Favorito> findByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    boolean existsByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    /** Ids de los favoritos del usuario, para marcar el corazón en cualquier listado. */
    @Query("select f.producto.id from Favorito f where f.usuario.id = :usuarioId")
    List<Long> buscarIdsDeProductos(Long usuarioId);

    /** Los favoritos del usuario, del más reciente al más viejo. */
    @Query("select f.producto.id from Favorito f where f.usuario.id = :usuarioId order by f.marcadoEn desc")
    List<Long> buscarIdsDeProductosPorFecha(Long usuarioId);

    /** Al eliminar un producto hay que soltar los favoritos que lo apuntaban. */
    @Modifying
    @Query("delete from Favorito f where f.producto.id = :productoId")
    int eliminarPorProducto(Long productoId);
}
