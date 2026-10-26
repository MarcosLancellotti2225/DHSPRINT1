package com.nexthome.reservas.controller;

import com.nexthome.reservas.PruebaDeApi;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Favoritos")
class FavoritoControllerTest extends PruebaDeApi {

    private String tokenAdmin;
    private String tokenAna;
    private Usuario ana;

    @BeforeEach
    void prepararUsuarios() {
        tokenAdmin = tokenDeAdmin();
        ana = crearUsuario("ana@nexthome.com", Rol.USER);
        tokenAna = tokenDe(ana.getEmail());
    }

    // --- Marcar y desmarcar (historia #24) -----------------------------------

    @Test
    @DisplayName("un usuario identificado marca un producto como favorito")
    void marcaUnFavorito() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(put("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productoId").value(id))
                .andExpect(jsonPath("$.favorito").value(true));

        assertThat(favoritoRepository.existsByUsuarioIdAndProductoId(ana.getId(), id)).isTrue();
    }

    @Test
    @DisplayName("marcar dos veces el mismo producto no lo duplica")
    void marcarDosVecesNoDuplica() throws Exception {
        long id = crearProducto("Hotel del Valle");

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(put("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.favorito").value(true));
        }

        assertThat(favoritoRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("desmarca un favorito")
    void desmarcaUnFavorito() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(put("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)));

        mockMvc.perform(delete("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorito").value(false));

        assertThat(favoritoRepository.count()).isZero();
    }

    @Test
    @DisplayName("desmarcar algo que no estaba marcado no falla")
    void desmarcarSinMarcarNoFalla() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(delete("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorito").value(false));
    }

    @Test
    @DisplayName("devuelve 404 al marcar un producto inexistente")
    void devuelve404SiElProductoNoExiste() throws Exception {
        mockMvc.perform(put("/api/favoritos/{id}", 9999).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("sin sesión no se puede marcar un favorito")
    void rechazaSinSesion() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(put("/api/favoritos/{id}", id))
                .andExpect(status().isUnauthorized());

        assertThat(favoritoRepository.count()).isZero();
    }

    // --- Listado (historia #25) ----------------------------------------------

    @Test
    @DisplayName("lista los favoritos del usuario, del más reciente al más viejo")
    void listaLosFavoritos() throws Exception {
        long primero = crearProducto("Hotel del Valle");
        long segundo = crearProducto("Cabaña del Lago");

        mockMvc.perform(put("/api/favoritos/{id}", primero).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)));
        Thread.sleep(10);
        mockMvc.perform(put("/api/favoritos/{id}", segundo).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)));

        mockMvc.perform(get("/api/favoritos").header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombre").value("Cabaña del Lago"))
                .andExpect(jsonPath("$[1].nombre").value("Hotel del Valle"));
    }

    @Test
    @DisplayName("cada usuario ve sólo sus propios favoritos")
    void losFavoritosSonDeCadaUsuario() throws Exception {
        long id = crearProducto("Hotel del Valle");
        Usuario otro = crearUsuario("otro@nexthome.com", Rol.USER);
        String tokenOtro = tokenDe(otro.getEmail());

        mockMvc.perform(put("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)));

        mockMvc.perform(get("/api/favoritos").header(HttpHeaders.AUTHORIZATION, bearer(tokenOtro)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("sin sesión no se puede ver la lista de favoritos")
    void rechazaElListadoSinSesion() throws Exception {
        mockMvc.perform(get("/api/favoritos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("al eliminar un producto se sueltan sus favoritos")
    void alEliminarElProductoSeSueltanLosFavoritos() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(put("/api/favoritos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)));

        mockMvc.perform(delete("/api/productos/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isNoContent());

        assertThat(favoritoRepository.count()).isZero();
        mockMvc.perform(get("/api/favoritos").header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(jsonPath("$.length()").value(0));
    }

    private long crearProducto(String nombre) throws Exception {
        MockMultipartFile imagen = new MockMultipartFile(
                "imagenes", "foto.png", MediaType.IMAGE_PNG_VALUE, new byte[] {(byte) 0x89, 'P', 'N', 'G'});

        MvcResult resultado = mockMvc.perform(multipart("/api/productos")
                        .file(imagen)
                        .param("nombre", nombre)
                        .param("descripcion", "Descripción de " + nombre)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(resultado.getResponse().getContentAsString()).get("id").asLong();
    }
}
