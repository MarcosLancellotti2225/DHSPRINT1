package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Ciudad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CiudadRepository extends JpaRepository<Ciudad, Long> {

    Optional<Ciudad> findByNombreIgnoreCase(String nombre);

    List<Ciudad> findAllByOrderByNombreAsc();
}
