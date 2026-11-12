package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.DisponibilidadResponse;
import com.nexthome.reservas.dto.ReservaRequest;
import com.nexthome.reservas.dto.ReservaResponse;
import com.nexthome.reservas.exception.FechasInvalidasException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.exception.SinDisponibilidadException;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.Reserva;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.ProductoRepository;
import com.nexthome.reservas.repository.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReservaService {

    /** Tope de noches por reserva, para que una estadía no bloquee el año entero. */
    private static final int NOCHES_MAXIMAS = 30;

    private final ReservaRepository repository;
    private final ProductoRepository productoRepository;

    private final CorreoService correoService;

    public ReservaService(ReservaRepository repository, ProductoRepository productoRepository,
                          CorreoService correoService) {
        this.repository = repository;
        this.productoRepository = productoRepository;
        this.correoService = correoService;
    }

    /** Tramos ocupados de un alojamiento, de hoy en adelante. */
    @Transactional(readOnly = true)
    public DisponibilidadResponse disponibilidad(Long productoId) {
        if (!productoRepository.existsById(productoId)) {
            throw new RecursoNoEncontradoException("No existe un producto con id " + productoId);
        }

        List<DisponibilidadResponse.TramoOcupado> ocupadas =
                repository.buscarDesde(productoId, LocalDate.now()).stream()
                        .map(r -> new DisponibilidadResponse.TramoOcupado(r.getEntrada(), r.getSalida()))
                        .toList();

        return new DisponibilidadResponse(productoId, ocupadas);
    }

    @Transactional
    public ReservaResponse crear(ReservaRequest request, Usuario usuario) {
        validarRango(request.entrada(), request.salida());

        Producto producto = productoRepository.findById(request.productoId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe un producto con id " + request.productoId()));

        if (!repository.buscarSuperpuestas(producto.getId(), request.entrada(), request.salida()).isEmpty()) {
            throw new SinDisponibilidadException();
        }

        Reserva reserva = new Reserva(
                producto, usuario, request.entrada(), request.salida(), request.huespedes());
        Reserva guardada = repository.save(reserva);

        // El aviso va después de guardar y no puede deshacer la reserva: si el correo
        // falla, la reserva sigue siendo válida y queda registrado en el log.
        correoService.enviarConfirmacionDeReserva(guardada);

        return ReservaResponse.desde(guardada);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarDelUsuario(Usuario usuario) {
        return repository.buscarDelUsuario(usuario.getId()).stream()
                .map(ReservaResponse::desde)
                .toList();
    }

    /**
     * Reglas del rango, iguales a las que valida el frontend: la salida tiene que ser
     * posterior a la entrada y la estadía no puede pasar del tope de noches.
     */
    private void validarRango(LocalDate entrada, LocalDate salida) {
        if (!salida.isAfter(entrada)) {
            throw new FechasInvalidasException("El check-out tiene que ser posterior al check-in");
        }
        if (entrada.plusDays(NOCHES_MAXIMAS).isBefore(salida)) {
            throw new FechasInvalidasException(
                    "La estadía no puede superar las " + NOCHES_MAXIMAS + " noches");
        }
    }
}
