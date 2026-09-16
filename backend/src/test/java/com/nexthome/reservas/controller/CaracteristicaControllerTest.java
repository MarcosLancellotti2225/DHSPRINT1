package com.nexthome.reservas.controller;

import com.nexthome.reservas.PruebaDeApi;
import com.nexthome.reservas.model.Caracteristica;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("API de características")
class CaracteristicaControllerTest extends PruebaDeApi {

    private static final Map<String, String> WIFI = Map.of("nombre", "Wi-Fi", "icono", "wifi");

    @Test
    @DisplayName("el listado es público y sale ordenado por nombre")
    void elListadoEsPublico() throws Exception {
        caracteristicaRepository.save(new Caracteristica("Pileta", "pileta"));
        caracteristicaRepository.save(new Caracteristica("Cocina equipada", "cocina"));

        mockMvc.perform(get("/api/caracteristicas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombre").value("Cocina equipada"));
    }

    // --- Alta, edición y baja (historia #17) --------------------------------

    @Test
    @DisplayName("un administrador crea una característica con su nombre e ícono")
    void creaCaracteristica() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(post("/api/caracteristicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(WIFI))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Wi-Fi"))
                .andExpect(jsonPath("$.icono").value("wifi"));

        assertThat(caracteristicaRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 409 un nombre ya usado")
    void rechazaNombreDuplicado() throws Exception {
        String token = tokenDeAdmin();
        caracteristicaRepository.save(new Caracteristica("Wi-Fi", "wifi"));

        mockMvc.perform(post("/api/caracteristicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(WIFI))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isConflict());

        assertThat(caracteristicaRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 400 el alta sin nombre ni ícono")
    void rechazaCamposVacios() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(post("/api/caracteristicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nombre", "", "icono", "")))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.icono").exists());
    }

    @Test
    @DisplayName("edita una característica existente")
    void editaCaracteristica() throws Exception {
        String token = tokenDeAdmin();
        Caracteristica caracteristica = caracteristicaRepository.save(new Caracteristica("Wifi", "wifi"));

        mockMvc.perform(put("/api/caracteristicas/{id}", caracteristica.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nombre", "Wi-Fi", "icono", "wifi")))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Wi-Fi"));
    }

    @Test
    @DisplayName("elimina una característica")
    void eliminaCaracteristica() throws Exception {
        String token = tokenDeAdmin();
        Caracteristica caracteristica = caracteristicaRepository.save(new Caracteristica("Wi-Fi", "wifi"));

        mockMvc.perform(delete("/api/caracteristicas/{id}", caracteristica.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        assertThat(caracteristicaRepository.count()).isZero();
    }

    @Test
    @DisplayName("devuelve 404 al eliminar una característica inexistente")
    void devuelve404AlEliminarInexistente() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(delete("/api/caracteristicas/{id}", 9999)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound());
    }

    // --- Protección por rol -------------------------------------------------

    @Test
    @DisplayName("sin token no se puede crear una característica")
    void rechazaAltaSinToken() throws Exception {
        mockMvc.perform(post("/api/caracteristicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(WIFI)))
                .andExpect(status().isUnauthorized());

        assertThat(caracteristicaRepository.count()).isZero();
    }

    @Test
    @DisplayName("un usuario común no puede crear una característica")
    void rechazaAltaDeUsuarioComun() throws Exception {
        String token = tokenDeUsuarioComun();

        mockMvc.perform(post("/api/caracteristicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(WIFI))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());

        assertThat(caracteristicaRepository.count()).isZero();
    }
}
