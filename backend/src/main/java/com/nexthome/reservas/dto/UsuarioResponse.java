package com.nexthome.reservas.dto;

import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;

/** Vista pública de un usuario. Deliberadamente no incluye la contraseña. */
public record UsuarioResponse(
        Long id, String nombre, String apellido, String email, Rol rol, String iniciales) {

    public static UsuarioResponse desde(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.iniciales());
    }
}
