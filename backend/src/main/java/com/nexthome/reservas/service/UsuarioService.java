package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.UsuarioResponse;
import com.nexthome.reservas.exception.OperacionNoPermitidaException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return repository.findAllByOrderByIdAsc().stream()
                .map(UsuarioResponse::desde)
                .toList();
    }

    /**
     * Otorga o quita el permiso de administrador.
     *
     * Un administrador no puede quitarse el permiso a sí mismo: si fuera el único que
     * queda, el sistema se quedaría sin nadie que pueda volver a asignarlo.
     */
    @Transactional
    public UsuarioResponse cambiarRol(Long id, boolean administrador, Usuario quienEjecuta) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un usuario con id " + id));

        if (!administrador && usuario.getId().equals(quienEjecuta.getId())) {
            throw new OperacionNoPermitidaException(
                    "No podés quitarte a vos mismo el permiso de administrador");
        }

        usuario.setRol(administrador ? Rol.ADMIN : Rol.USER);
        return UsuarioResponse.desde(repository.save(usuario));
    }
}
