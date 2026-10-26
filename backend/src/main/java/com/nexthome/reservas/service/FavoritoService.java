package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.FavoritoResponse;
import com.nexthome.reservas.dto.ProductoResponse;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Favorito;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.FavoritoRepository;
import com.nexthome.reservas.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoritoService {

    private final FavoritoRepository repository;
    private final ProductoRepository productoRepository;
    private final ProductoService productoService;

    public FavoritoService(FavoritoRepository repository, ProductoRepository productoRepository,
                           ProductoService productoService) {
        this.repository = repository;
        this.productoRepository = productoRepository;
        this.productoService = productoService;
    }

    /** Los favoritos del usuario, del más reciente al más viejo. */
    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(Usuario usuario) {
        return productoService.hidratarEnOrden(repository.buscarIdsDeProductosPorFecha(usuario.getId()));
    }

    @Transactional
    public FavoritoResponse marcar(Long productoId, Usuario usuario) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + productoId));

        if (!repository.existsByUsuarioIdAndProductoId(usuario.getId(), productoId)) {
            repository.save(new Favorito(usuario, producto));
        }
        return new FavoritoResponse(productoId, true);
    }

    /** Desmarcar algo que no estaba marcado tampoco es un error: se llega al mismo estado. */
    @Transactional
    public FavoritoResponse desmarcar(Long productoId, Usuario usuario) {
        repository.findByUsuarioIdAndProductoId(usuario.getId(), productoId)
                .ifPresent(repository::delete);
        return new FavoritoResponse(productoId, false);
    }
}
