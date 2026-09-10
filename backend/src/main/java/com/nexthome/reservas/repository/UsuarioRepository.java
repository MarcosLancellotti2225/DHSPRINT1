package com.nexthome.reservas.repository;

import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Usuario> findAllByOrderByIdAsc();

    long countByRol(Rol rol);
}
