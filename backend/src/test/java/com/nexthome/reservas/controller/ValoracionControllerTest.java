package com.nexthome.reservas.controller;

import com.nexthome.reservas.PruebaDeApi;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.Reserva;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Valoraciones")
class ValoracionControllerTest extends PruebaDeApi {

    private static final LocalDate HOY = LocalDate.now();

    private String tokenAdmin;
    private String tokenAna;
    private Usuario ana;

    @BeforeEach
    void prepararUsuarios() {
        tokenAdmin = tokenDeAdmin();
        ana = crearUsuario("ana@nexthome.com", Rol.USER);
        tokenAna = tokenDe(ana.getEmail());
    }

    // --- Quién puede puntuar -------------------------------------------------

    @Test
    @DisplayName("quien ya se hospedó puede puntuar")
    void puntuaQuienSeHospedo() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);

        mockMvc.perform(valorar(id, 5, "Impecable, volvería.", tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estrellas").value(5))
                .andExpect(jsonPath("$.comentario").value("Impecable, volvería."))
                .andExpect(jsonPath("$.autor").value("Ana Gómez"));

        assertThat(valoracionRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("sin haberse hospedado no se puede puntuar")
    void rechazaAQuienNoSeHospedo() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(valorar(id, 5, "No me alojé nunca.", tokenAna))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").value(
                        org.hamcrest.Matchers.containsString("ya te hayas hospedado")));

        assertThat(valoracionRepository.count()).isZero();
    }

    @Test
    @DisplayName("con una estadía todavía en curso tampoco se puede puntuar")
    void rechazaConEstadiaSinTerminar() throws Exception {
        long id = crearProducto("Hotel del Valle");
        Producto producto = productoRepository.findById(id).orElseThrow();
        // La estadía termina en el futuro: todavía no se puede opinar.
        reservaRepository.save(new Reserva(producto, ana, HOY.plusDays(2), HOY.plusDays(6), 2));

        mockMvc.perform(valorar(id, 4, null, tokenAna))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("sin sesión no se puede puntuar")
    void rechazaSinSesion() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(post("/api/productos/{id}/valoraciones", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(5, "Buenísimo")))
                .andExpect(status().isUnauthorized());
    }

    // --- Validación ----------------------------------------------------------

    @Test
    @DisplayName("rechaza una puntuación fuera del rango de 1 a 5")
    void rechazaPuntuacionFueraDeRango() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);

        mockMvc.perform(valorar(id, 0, null, tokenAna)).andExpect(status().isBadRequest());
        mockMvc.perform(valorar(id, 6, null, tokenAna)).andExpect(status().isBadRequest());

        assertThat(valoracionRepository.count()).isZero();
    }

    @Test
    @DisplayName("el comentario es opcional")
    void elComentarioEsOpcional() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);

        mockMvc.perform(valorar(id, 4, null, tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estrellas").value(4))
                .andExpect(jsonPath("$.comentario").doesNotExist());
    }

    @Test
    @DisplayName("puntuar dos veces actualiza la reseña en vez de duplicarla")
    void volverAPuntuarActualiza() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);

        mockMvc.perform(valorar(id, 2, "Me pareció regular.", tokenAna)).andExpect(status().isOk());
        mockMvc.perform(valorar(id, 5, "Lo reconsideré, muy bueno.", tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estrellas").value(5));

        assertThat(valoracionRepository.count()).isEqualTo(1);
    }

    // --- Listado y promedio --------------------------------------------------

    @Test
    @DisplayName("el listado de reseñas es público y trae el promedio")
    void listaLasReseniasConPromedio() throws Exception {
        long id = crearProducto("Hotel del Valle");
        Usuario otro = crearUsuario("otro@nexthome.com", Rol.USER);
        hospedar(ana, id);
        hospedar(otro, id);

        mockMvc.perform(valorar(id, 5, "Excelente.", tokenAna)).andExpect(status().isOk());
        mockMvc.perform(valorar(id, 4, "Muy bueno.", tokenDe(otro.getEmail()))).andExpect(status().isOk());

        mockMvc.perform(get("/api/productos/{id}/valoraciones", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.promedio").value(4.5))
                .andExpect(jsonPath("$.cantidad").value(2))
                .andExpect(jsonPath("$.resenias.length()").value(2))
                .andExpect(jsonPath("$.puedePuntuar").value(false));
    }

    @Test
    @DisplayName("sin reseñas el promedio es cero")
    void sinReseniasElPromedioEsCero() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(get("/api/productos/{id}/valoraciones", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.promedio").value(0.0))
                .andExpect(jsonPath("$.cantidad").value(0));
    }

    @Test
    @DisplayName("a quien se hospedó se le avisa que puede puntuar")
    void avisaQuienPuedePuntuar() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);

        mockMvc.perform(get("/api/productos/{id}/valoraciones", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedePuntuar").value(true))
                .andExpect(jsonPath("$.miValoracion").doesNotExist());
    }

    @Test
    @DisplayName("si ya puntuó, se le devuelve lo que había puesto")
    void devuelveLaValoracionPropia() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);
        mockMvc.perform(valorar(id, 3, "Correcto.", tokenAna)).andExpect(status().isOk());

        mockMvc.perform(get("/api/productos/{id}/valoraciones", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.miValoracion.estrellas").value(3))
                .andExpect(jsonPath("$.miValoracion.comentario").value("Correcto."));
    }

    @Test
    @DisplayName("el detalle del producto muestra su puntuación")
    void elDetalleTraeLaPuntuacion() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);
        mockMvc.perform(valorar(id, 5, null, tokenAna)).andExpect(status().isOk());

        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puntuacion").value(5.0))
                .andExpect(jsonPath("$.valoraciones").value(1));
    }

    @Test
    @DisplayName("el listado de productos también muestra la puntuación")
    void elListadoTraeLaPuntuacion() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);
        mockMvc.perform(valorar(id, 4, null, tokenAna)).andExpect(status().isOk());

        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido[0].puntuacion").value(4.0))
                .andExpect(jsonPath("$.contenido[0].valoraciones").value(1));
    }

    @Test
    @DisplayName("devuelve 404 si el alojamiento no existe")
    void devuelve404SiNoExiste() throws Exception {
        mockMvc.perform(get("/api/productos/{id}/valoraciones", 9999))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("al eliminar un alojamiento se borran sus reseñas")
    void alEliminarElProductoSeBorranLasResenias() throws Exception {
        long id = crearProducto("Hotel del Valle");
        hospedar(ana, id);
        mockMvc.perform(valorar(id, 5, null, tokenAna)).andExpect(status().isOk());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/productos/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isNoContent());

        assertThat(valoracionRepository.count()).isZero();
    }

    // --- Utilidades ----------------------------------------------------------

    /** Deja una estadía ya terminada, que es lo que habilita a puntuar. */
    private void hospedar(Usuario usuario, long productoId) {
        Producto producto = productoRepository.findById(productoId).orElseThrow();
        reservaRepository.save(new Reserva(producto, usuario, HOY.minusDays(10), HOY.minusDays(7), 2));
    }

    private String cuerpo(Integer estrellas, String comentario) throws Exception {
        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("estrellas", estrellas);
        datos.put("comentario", comentario);
        return objectMapper.writeValueAsString(datos);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder valorar(
            long productoId, Integer estrellas, String comentario, String token) throws Exception {
        return post("/api/productos/{id}/valoraciones", productoId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo(estrellas, comentario))
                .header(HttpHeaders.AUTHORIZATION, bearer(token));
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
