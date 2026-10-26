package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.ValoracionRequest;
import com.nexthome.reservas.dto.ValoracionResponse;
import com.nexthome.reservas.dto.ValoracionesResponse;
import com.nexthome.reservas.exception.NoPuedeValorarException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.model.Valoracion;
import com.nexthome.reservas.repository.ProductoRepository;
import com.nexthome.reservas.repository.ReservaRepository;
import com.nexthome.reservas.repository.ValoracionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ValoracionService {

    private final ValoracionRepository repository;
    private final ProductoRepository productoRepository;
    private final ReservaRepository reservaRepository;

    public ValoracionService(ValoracionRepository repository, ProductoRepository productoRepository,
                             ReservaRepository reservaRepository) {
        this.repository = repository;
        this.productoRepository = productoRepository;
        this.reservaRepository = reservaRepository;
    }

    /**
     * Reseñas de un alojamiento. El usuario puede venir en null: la lista es pública
     * y en ese caso simplemente no se puede puntuar.
     */
    @Transactional(readOnly = true)
    public ValoracionesResponse listar(Long productoId, Usuario usuario) {
        if (!productoRepository.existsById(productoId)) {
            throw new RecursoNoEncontradoException("No existe un producto con id " + productoId);
        }

        List<ValoracionResponse> resenias = repository.buscarDelProducto(productoId).stream()
                .map(ValoracionResponse::desde)
                .toList();

        ValoracionResponse mia = usuario == null
                ? null
                : repository.findByUsuarioIdAndProductoId(usuario.getId(), productoId)
                        .map(ValoracionResponse::desde)
                        .orElse(null);

        return new ValoracionesResponse(
                redondear(repository.promedioDe(productoId)),
                repository.countByProductoId(productoId),
                usuario != null && seHospedo(usuario, productoId),
                mia,
                resenias);
    }

    /**
     * Guarda la puntuación. Si el usuario ya había valorado este alojamiento, se
     * actualiza la suya en lugar de sumar otra reseña.
     */
    @Transactional
    public ValoracionResponse valorar(Long productoId, ValoracionRequest request, Usuario usuario) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + productoId));

        if (!seHospedo(usuario, productoId)) {
            throw new NoPuedeValorarException();
        }

        String comentario = request.comentario() == null || request.comentario().isBlank()
                ? null
                : request.comentario().trim();

        Valoracion valoracion = repository.findByUsuarioIdAndProductoId(usuario.getId(), productoId)
                .orElseGet(() -> new Valoracion(producto, usuario, request.estrellas(), comentario));

        valoracion.setEstrellas(request.estrellas());
        valoracion.setComentario(comentario);

        return ValoracionResponse.desde(repository.save(valoracion));
    }

    /** Sólo puede puntuar quien ya terminó una estadía en ese alojamiento. */
    private boolean seHospedo(Usuario usuario, Long productoId) {
        return reservaRepository.finalizoUnaEstadia(usuario.getId(), productoId, LocalDate.now());
    }

    /** Una decimal alcanza: "4,3 estrellas" se lee mejor que "4,333333". */
    private static double redondear(Double promedio) {
        return promedio == null ? 0 : Math.round(promedio * 10) / 10.0;
    }
}
