package com.nexthome.reservas.controller;

import com.nexthome.reservas.PruebaDeApi;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Administración de usuarios")
class UsuarioControllerTest extends PruebaDeApi {

    @Test
    @DisplayName("un administrador ve el listado de usuarios registrados")
    void listaLosUsuarios() throws Exception {
        String token = tokenDeAdmin();
        crearUsuario("ana@nexthome.com", Rol.USER);

        mockMvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("sin token el listado responde 401")
    void rechazaElListadoSinToken() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un usuario común no puede ver el listado")
    void rechazaElListadoAUsuarioComun() throws Exception {
        String token = tokenDeUsuarioComun();

        mockMvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());
    }

    // --- Otorgar y quitar permisos (historia #16) ---------------------------

    @Test
    @DisplayName("otorga permisos de administrador y el usuario los usa de inmediato")
    void otorgaPermisosDeAdministrador() throws Exception {
        String tokenAdmin = tokenDeAdmin();
        Usuario ana = crearUsuario("ana@nexthome.com", Rol.USER);
        String tokenAna = tokenDe(ana.getEmail());

        // Antes del cambio no tiene acceso.
        mockMvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/usuarios/{id}/rol", ana.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("administrador", true)))
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ADMIN"));

        // El permiso es efectivo en el backend, con el mismo token de antes.
        mockMvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("quita permisos de administrador y el acceso deja de funcionar")
    void quitaPermisosDeAdministrador() throws Exception {
        String tokenAdmin = tokenDeAdmin();
        Usuario ana = crearUsuario("ana@nexthome.com", Rol.ADMIN);
        String tokenAna = tokenDe(ana.getEmail());

        mockMvc.perform(patch("/api/usuarios/{id}/rol", ana.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("administrador", false)))
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("USER"));

        mockMvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("un administrador no puede quitarse a sí mismo el permiso")
    void noPuedeQuitarseElPermisoASiMismo() throws Exception {
        Usuario admin = crearUsuario("jefe@nexthome.com", Rol.ADMIN);
        String token = tokenDe(admin.getEmail());

        mockMvc.perform(patch("/api/usuarios/{id}/rol", admin.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("administrador", false)))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value(
                        org.hamcrest.Matchers.containsString("No podés quitarte a vos mismo")));

        assertThat(usuarioRepository.findById(admin.getId()).orElseThrow().getRol()).isEqualTo(Rol.ADMIN);
    }

    @Test
    @DisplayName("devuelve 404 al cambiar el rol de un usuario inexistente")
    void devuelve404SiElUsuarioNoExiste() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(patch("/api/usuarios/{id}/rol", 9999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("administrador", true)))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound());
    }
}
