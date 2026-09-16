package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    boolean existsByTituloIgnoreCase(String titulo);

    boolean existsByTituloIgnoreCaseAndIdNot(String titulo, Long id);

    Optional<Categoria> findByTituloIgnoreCase(String titulo);

    List<Categoria> findAllByOrderByTituloAsc();
}
