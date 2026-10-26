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

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Reservas y disponibilidad")
class ReservaControllerTest extends PruebaDeApi {

    private static final LocalDate HOY = LocalDate.now();

    private String tokenAdmin;
    private String tokenAna;

    @BeforeEach
    void prepararUsuarios() {
        tokenAdmin = tokenDeAdmin();
        Usuario ana = crearUsuario("ana@nexthome.com", Rol.USER);
        tokenAna = tokenDe(ana.getEmail());
    }

    // --- Crear una reserva ---------------------------------------------------

    @Test
    @DisplayName("un usuario identificado reserva un alojamiento")
    void creaUnaReserva() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(13), tokenAna))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productoId").value(id))
                .andExpect(jsonPath("$.noches").value(3))
                .andExpect(jsonPath("$.finalizada").value(false));

        assertThat(reservaRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("sin sesión no se puede reservar")
    void rechazaReservarSinSesion() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(id, HOY.plusDays(10), HOY.plusDays(13))))
                .andExpect(status().isUnauthorized());

        assertThat(reservaRepository.count()).isZero();
    }

    @Test
    @DisplayName("rechaza con 409 un rango que pisa otra reserva")
    void rechazaFechasOcupadas() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(15), tokenAna))
                .andExpect(status().isCreated());

        mockMvc.perform(reservar(id, HOY.plusDays(12), HOY.plusDays(18), tokenAdmin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value(
                        org.hamcrest.Matchers.containsString("ya está reservado")));

        assertThat(reservaRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("se puede entrar el mismo día que otro huésped se va")
    void permiteEncadenarEstadias() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(15), tokenAna))
                .andExpect(status().isCreated());

        // La noche del 15 queda libre: ese día el anterior se va.
        mockMvc.perform(reservar(id, HOY.plusDays(15), HOY.plusDays(18), tokenAdmin))
                .andExpect(status().isCreated());

        assertThat(reservaRepository.count()).isEqualTo(2);
    }

    @Test
    @DisplayName("rechaza un check-out anterior o igual al check-in")
    void rechazaRangoInvertido() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(reservar(id, HOY.plusDays(12), HOY.plusDays(10), tokenAna))
                .andExpect(status().isBadRequest());
        mockMvc.perform(reservar(id, HOY.plusDays(12), HOY.plusDays(12), tokenAna))
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.count()).isZero();
    }

    @Test
    @DisplayName("rechaza un check-in en el pasado")
    void rechazaFechaPasada() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(reservar(id, HOY.minusDays(3), HOY.plusDays(3), tokenAna))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("rechaza una estadía más larga que el tope")
    void rechazaEstadiaDemasiadoLarga() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(reservar(id, HOY.plusDays(1), HOY.plusDays(45), tokenAna))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("30 noches")));
    }

    @Test
    @DisplayName("devuelve 404 al reservar un alojamiento inexistente")
    void devuelve404SiElProductoNoExiste() throws Exception {
        mockMvc.perform(reservar(9999L, HOY.plusDays(10), HOY.plusDays(12), tokenAna))
                .andExpect(status().isNotFound());
    }

    // --- Disponibilidad (historia #23) ---------------------------------------

    @Test
    @DisplayName("la disponibilidad es pública y lista los tramos ocupados")
    void listaLosTramosOcupados() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(13), tokenAna));

        mockMvc.perform(get("/api/reservas/disponibilidad/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productoId").value(id))
                .andExpect(jsonPath("$.ocupadas.length()").value(1))
                .andExpect(jsonPath("$.ocupadas[0].entrada").value(HOY.plusDays(10).toString()))
                .andExpect(jsonPath("$.ocupadas[0].salida").value(HOY.plusDays(13).toString()));
    }

    @Test
    @DisplayName("un alojamiento sin reservas no tiene tramos ocupados")
    void sinReservasNoHayOcupacion() throws Exception {
        long id = crearProducto("Hotel del Valle");

        mockMvc.perform(get("/api/reservas/disponibilidad/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ocupadas.length()").value(0));
    }

    @Test
    @DisplayName("devuelve 404 si se pide la disponibilidad de algo que no existe")
    void devuelve404SiNoExisteParaDisponibilidad() throws Exception {
        mockMvc.perform(get("/api/reservas/disponibilidad/{id}", 9999))
                .andExpect(status().isNotFound());
    }

    // --- Búsqueda por fechas (historia #22) ----------------------------------

    @Test
    @DisplayName("la búsqueda por fechas descarta los alojamientos ocupados")
    void laBusquedaDescartaLosOcupados() throws Exception {
        long ocupado = crearProducto("Hotel Ocupado");
        crearProducto("Hotel Libre");
        mockMvc.perform(reservar(ocupado, HOY.plusDays(10), HOY.plusDays(15), tokenAna));

        mockMvc.perform(get("/api/productos")
                        .param("entrada", HOY.plusDays(11).toString())
                        .param("salida", HOY.plusDays(13).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.contenido[0].nombre").value("Hotel Libre"));
    }

    @Test
    @DisplayName("fuera del tramo reservado el alojamiento vuelve a aparecer")
    void fueraDelTramoEstaDisponible() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(15), tokenAna));

        mockMvc.perform(get("/api/productos")
                        .param("entrada", HOY.plusDays(20).toString())
                        .param("salida", HOY.plusDays(22).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1));
    }

    @Test
    @DisplayName("sin fechas la búsqueda sigue devolviendo todo el catálogo")
    void sinFechasDevuelveTodo() throws Exception {
        long id = crearProducto("Hotel del Valle");
        crearProducto("Cabaña del Lago");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(15), tokenAna));

        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(2));
    }

    @Test
    @DisplayName("con media fecha no se filtra por disponibilidad")
    void conMediaFechaNoFiltra() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(15), tokenAna));

        mockMvc.perform(get("/api/productos").param("entrada", HOY.plusDays(11).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1));
    }

    // --- Mis reservas --------------------------------------------------------

    @Test
    @DisplayName("cada usuario ve sólo sus propias reservas")
    void lasReservasSonDeCadaUsuario() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(13), tokenAna));

        mockMvc.perform(get("/api/reservas/mias").header(HttpHeaders.AUTHORIZATION, bearer(tokenAna)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/reservas/mias").header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("al eliminar un alojamiento se sueltan sus reservas")
    void alEliminarElProductoSeSueltanLasReservas() throws Exception {
        long id = crearProducto("Hotel del Valle");
        mockMvc.perform(reservar(id, HOY.plusDays(10), HOY.plusDays(13), tokenAna));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/productos/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isNoContent());

        assertThat(reservaRepository.count()).isZero();
    }

    // --- Utilidades ----------------------------------------------------------

    private String cuerpo(long productoId, LocalDate entrada, LocalDate salida) throws Exception {
        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("productoId", productoId);
        datos.put("entrada", entrada.toString());
        datos.put("salida", salida.toString());
        datos.put("huespedes", 2);
        return objectMapper.writeValueAsString(datos);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder reservar(
            long productoId, LocalDate entrada, LocalDate salida, String token) throws Exception {
        return post("/api/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo(productoId, entrada, salida))
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
