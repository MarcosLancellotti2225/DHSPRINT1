package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Caracteristica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaracteristicaRepository extends JpaRepository<Caracteristica, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    Optional<Caracteristica> findByNombreIgnoreCase(String nombre);

    List<Caracteristica> findAllByOrderByNombreAsc();
}
