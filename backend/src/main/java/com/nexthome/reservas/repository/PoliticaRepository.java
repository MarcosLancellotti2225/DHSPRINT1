package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Politica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoliticaRepository extends JpaRepository<Politica, Long> {

    List<Politica> findAllByOrderByOrdenAsc();
}
