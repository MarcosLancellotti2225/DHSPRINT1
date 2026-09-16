package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.CategoriaRequest;
import com.nexthome.reservas.dto.CategoriaResponse;
import com.nexthome.reservas.exception.NombreDuplicadoException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Categoria;
import com.nexthome.reservas.repository.CategoriaRepository;
import com.nexthome.reservas.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository repository;
    private final ProductoRepository productoRepository;

    public CategoriaService(CategoriaRepository repository, ProductoRepository productoRepository) {
        this.repository = repository;
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        return repository.findAllByOrderByTituloAsc().stream()
                .map(CategoriaResponse::desde)
                .toList();
    }

    @Transactional
    public CategoriaResponse crear(CategoriaRequest request) {
        String titulo = request.titulo().trim();
        if (repository.existsByTituloIgnoreCase(titulo)) {
            throw NombreDuplicadoException.deCategoria(titulo);
        }
        Categoria categoria = new Categoria(titulo, request.descripcion().trim(), request.imagen().trim());
        return CategoriaResponse.desde(repository.save(categoria));
    }

    @Transactional
    public CategoriaResponse actualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscarEntidad(id);
        String titulo = request.titulo().trim();
        if (repository.existsByTituloIgnoreCaseAndIdNot(titulo, id)) {
            throw NombreDuplicadoException.deCategoria(titulo);
        }
        categoria.setTitulo(titulo);
        categoria.setDescripcion(request.descripcion().trim());
        categoria.setImagen(request.imagen().trim());
        return CategoriaResponse.desde(repository.save(categoria));
    }

    /**
     * Al borrar una categoría los productos que la tenían quedan sin categoría, en
     * lugar de arrastrarlos a la eliminación.
     */
    @Transactional
    public void eliminar(Long id) {
        Categoria categoria = buscarEntidad(id);
        productoRepository.desasignarCategoria(id);
        repository.delete(categoria);
    }

    private Categoria buscarEntidad(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una categoría con id " + id));
    }
}
