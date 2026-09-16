package com.nexthome.reservas.controller;

import com.nexthome.reservas.PruebaDeApi;
import com.nexthome.reservas.model.Categoria;
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

@DisplayName("API de categorías")
class CategoriaControllerTest extends PruebaDeApi {

    private static final Map<String, String> HOTELES = Map.of(
            "titulo", "Hoteles",
            "descripcion", "Con recepción, limpieza diaria y desayuno.",
            "imagen", "/uploads/hoteles.png");

    @Test
    @DisplayName("el listado es público")
    void elListadoEsPublico() throws Exception {
        categoriaRepository.save(new Categoria("Cabañas", "En el bosque.", "/uploads/c.png"));

        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Cabañas"));
    }

    // --- Alta (historia #21) ------------------------------------------------

    @Test
    @DisplayName("un administrador crea una categoría con título, descripción e imagen")
    void creaCategoria() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(HOTELES))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.titulo").value("Hoteles"))
                .andExpect(jsonPath("$.imagen").value("/uploads/hoteles.png"));

        assertThat(categoriaRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 409 un título ya usado")
    void rechazaTituloDuplicado() throws Exception {
        String token = tokenDeAdmin();
        categoriaRepository.save(new Categoria("Hoteles", "Ya existía.", "/uploads/h.png"));

        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(HOTELES))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isConflict());

        assertThat(categoriaRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 400 el alta sin título")
    void rechazaCamposVacios() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("titulo", "", "descripcion", "", "imagen", "")))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.titulo").exists());
    }

    @Test
    @DisplayName("sin token no se puede crear una categoría")
    void rechazaAltaSinToken() throws Exception {
        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(HOTELES)))
                .andExpect(status().isUnauthorized());

        assertThat(categoriaRepository.count()).isZero();
    }

    @Test
    @DisplayName("un usuario común no puede crear una categoría")
    void rechazaAltaDeUsuarioComun() throws Exception {
        String token = tokenDeUsuarioComun();

        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(HOTELES))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());

        assertThat(categoriaRepository.count()).isZero();
    }

    // --- Edición y baja -----------------------------------------------------

    @Test
    @DisplayName("edita una categoría existente")
    void editaCategoria() throws Exception {
        String token = tokenDeAdmin();
        Categoria categoria = categoriaRepository.save(
                new Categoria("Hoteles", "Descripción vieja.", "/uploads/h.png"));

        mockMvc.perform(put("/api/categorias/{id}", categoria.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Hoteles boutique",
                                "descripcion", "Descripción nueva.",
                                "imagen", "/uploads/nueva.png")))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Hoteles boutique"))
                .andExpect(jsonPath("$.descripcion").value("Descripción nueva."));
    }

    @Test
    @DisplayName("devuelve 404 al editar una categoría inexistente")
    void devuelve404AlEditarInexistente() throws Exception {
        String token = tokenDeAdmin();

        mockMvc.perform(put("/api/categorias/{id}", 9999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(HOTELES))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("elimina una categoría")
    void eliminaCategoria() throws Exception {
        String token = tokenDeAdmin();
        Categoria categoria = categoriaRepository.save(
                new Categoria("Hoteles", "Con recepción.", "/uploads/h.png"));

        mockMvc.perform(delete("/api/categorias/{id}", categoria.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        assertThat(categoriaRepository.count()).isZero();
    }

    @Test
    @DisplayName("un usuario común no puede eliminar una categoría")
    void rechazaBajaDeUsuarioComun() throws Exception {
        String token = tokenDeUsuarioComun();
        Categoria categoria = categoriaRepository.save(
                new Categoria("Hoteles", "Con recepción.", "/uploads/h.png"));

        mockMvc.perform(delete("/api/categorias/{id}", categoria.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());

        assertThat(categoriaRepository.count()).isEqualTo(1);
    }
}
