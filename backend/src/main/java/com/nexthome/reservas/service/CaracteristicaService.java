package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.CaracteristicaRequest;
import com.nexthome.reservas.dto.CaracteristicaResponse;
import com.nexthome.reservas.exception.NombreDuplicadoException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Caracteristica;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.repository.CaracteristicaRepository;
import com.nexthome.reservas.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CaracteristicaService {

    private final CaracteristicaRepository repository;
    private final ProductoRepository productoRepository;

    public CaracteristicaService(CaracteristicaRepository repository, ProductoRepository productoRepository) {
        this.repository = repository;
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<CaracteristicaResponse> listar() {
        return repository.findAllByOrderByNombreAsc().stream()
                .map(CaracteristicaResponse::desde)
                .toList();
    }

    @Transactional
    public CaracteristicaResponse crear(CaracteristicaRequest request) {
        String nombre = request.nombre().trim();
        if (repository.existsByNombreIgnoreCase(nombre)) {
            throw NombreDuplicadoException.deCaracteristica(nombre);
        }
        return CaracteristicaResponse.desde(
                repository.save(new Caracteristica(nombre, request.icono().trim())));
    }

    @Transactional
    public CaracteristicaResponse actualizar(Long id, CaracteristicaRequest request) {
        Caracteristica caracteristica = buscarEntidad(id);
        String nombre = request.nombre().trim();
        if (repository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw NombreDuplicadoException.deCaracteristica(nombre);
        }
        caracteristica.setNombre(nombre);
        caracteristica.setIcono(request.icono().trim());
        return CaracteristicaResponse.desde(repository.save(caracteristica));
    }

    /** Antes de borrarla hay que soltarla de los productos que la tenían asociada. */
    @Transactional
    public void eliminar(Long id) {
        Caracteristica caracteristica = buscarEntidad(id);
        for (Producto producto : productoRepository.buscarPorCaracteristica(id)) {
            producto.getCaracteristicas().remove(caracteristica);
        }
        repository.delete(caracteristica);
    }

    private Caracteristica buscarEntidad(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una característica con id " + id));
    }
}
