package com.nexthome.reservas.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexthome.reservas.repository.ProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("API de productos")
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductoRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void limpiarBase() {
        repository.deleteAll();
    }

    // --- Alta de producto (historia #3) -------------------------------------

    @Test
    @DisplayName("crea un producto con sus imágenes y devuelve 201")
    void creaProductoConImagenes() throws Exception {
        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("frente.png"))
                        .file(imagen("pileta.png"))
                        .param("nombre", "Hotel del Valle")
                        .param("descripcion", "Un hotel de montaña con vista al valle."))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nombre").value("Hotel del Valle"))
                .andExpect(jsonPath("$.imagenes.length()").value(2));

        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 409 un nombre ya usado, sin importar mayúsculas")
    void rechazaNombreDuplicado() throws Exception {
        crearProducto("Cabaña del Lago");

        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", "cabaña DEL lago")
                        .param("descripcion", "Otra descripción distinta."))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.estado").value(409))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("ya está en uso")));

        // El duplicado no debe haberse guardado.
        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 400 el alta sin nombre ni descripción")
    void rechazaCamposObligatoriosVacios() throws Exception {
        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", "")
                        .param("descripcion", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.descripcion").exists());

        assertThat(repository.count()).isZero();
    }

    @Test
    @DisplayName("rechaza con 400 un archivo que no es una imagen")
    void rechazaArchivoNoImagen() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile(
                "imagenes", "contrato.pdf", MediaType.APPLICATION_PDF_VALUE, new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/productos")
                        .file(pdf)
                        .param("nombre", "Hotel con PDF")
                        .param("descripcion", "No debería crearse."))
                .andExpect(status().isBadRequest());

        assertThat(repository.count()).isZero();
    }

    // --- Listado paginado (historias #8 y #10) ------------------------------

    @Test
    @DisplayName("nunca devuelve más de 10 productos por página, aunque se pida más")
    void limitaLaPaginaADiezProductos() throws Exception {
        crearProductos(12);

        mockMvc.perform(get("/api/productos").param("page", "0").param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido.length()").value(10))
                .andExpect(jsonPath("$.tamanio").value(10))
                .andExpect(jsonPath("$.totalElementos").value(12))
                .andExpect(jsonPath("$.totalPaginas").value(2))
                .andExpect(jsonPath("$.primera").value(true))
                .andExpect(jsonPath("$.ultima").value(false));
    }

    @Test
    @DisplayName("la última página trae el resto y se marca como última")
    void devuelveLaUltimaPagina() throws Exception {
        crearProductos(12);

        mockMvc.perform(get("/api/productos").param("page", "1").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido.length()").value(2))
                .andExpect(jsonPath("$.pagina").value(1))
                .andExpect(jsonPath("$.primera").value(false))
                .andExpect(jsonPath("$.ultima").value(true));
    }

    // --- Aleatorios del home (historia #4) ----------------------------------

    @Test
    @DisplayName("devuelve como máximo 10 aleatorios y sin repetir ninguno")
    void devuelveAleatoriosSinRepetidos() throws Exception {
        crearProductos(12);

        List<Long> ids = idsDeAleatorios(10);

        assertThat(ids).hasSize(10);
        assertThat(new HashSet<>(ids)).as("no debe repetir productos").hasSize(10);
    }

    @Test
    @DisplayName("el orden de los aleatorios cambia entre llamadas")
    void elOrdenDeLosAleatoriosVaria() throws Exception {
        crearProductos(12);

        // Con 12 productos la probabilidad de que 8 llamadas devuelvan el mismo
        // orden por azar es despreciable, así que si pasa es que no hay aleatoriedad.
        Set<List<Long>> ordenesVistos = new HashSet<>();
        for (int i = 0; i < 8; i++) {
            ordenesVistos.add(idsDeAleatorios(10));
        }

        assertThat(ordenesVistos).as("siempre devolvió el mismo orden").hasSizeGreaterThan(1);
    }

    @Test
    @DisplayName("si hay menos productos que el límite, devuelve los que hay")
    void devuelveMenosAleatoriosSiNoAlcanzan() throws Exception {
        crearProductos(3);

        mockMvc.perform(get("/api/productos/random").param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    // --- Detalle (historia #5) ----------------------------------------------

    @Test
    @DisplayName("devuelve el detalle con todas sus imágenes")
    void devuelveElDetalle() throws Exception {
        long id = crearProducto("Loft del Centro");

        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.nombre").value("Loft del Centro"))
                .andExpect(jsonPath("$.imagenes.length()").value(1));
    }

    @Test
    @DisplayName("devuelve 404 si el producto no existe")
    void devuelve404SiNoExiste() throws Exception {
        mockMvc.perform(get("/api/productos/{id}", 9999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.estado").value(404));
    }

    // --- Baja (historia #11) ------------------------------------------------

    @Test
    @DisplayName("elimina el producto y deja de aparecer en el listado")
    void eliminaElProducto() throws Exception {
        long id = crearProducto("Hostel de Paso");

        mockMvc.perform(delete("/api/productos/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(status().isNotFound());

        assertThat(repository.count()).isZero();
    }

    @Test
    @DisplayName("devuelve 404 al intentar eliminar algo que no existe")
    void devuelve404AlEliminarInexistente() throws Exception {
        mockMvc.perform(delete("/api/productos/{id}", 9999))
                .andExpect(status().isNotFound());
    }

    // --- Utilidades ---------------------------------------------------------

    private MockMultipartFile imagen(String nombreArchivo) {
        return new MockMultipartFile("imagenes", nombreArchivo, MediaType.IMAGE_PNG_VALUE,
                new byte[] {(byte) 0x89, 'P', 'N', 'G'});
    }

    /** Da de alta un producto y devuelve su id. */
    private long crearProducto(String nombre) throws Exception {
        MvcResult resultado = mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", nombre)
                        .param("descripcion", "Descripción de " + nombre))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(resultado.getResponse().getContentAsString()).get("id").asLong();
    }

    private void crearProductos(int cantidad) throws Exception {
        for (int i = 1; i <= cantidad; i++) {
            crearProducto("Alojamiento " + i);
        }
    }

    private List<Long> idsDeAleatorios(int limite) throws Exception {
        MvcResult resultado = mockMvc.perform(get("/api/productos/random").param("limit", String.valueOf(limite)))
                .andExpect(status().isOk())
                .andReturn();

        List<Long> ids = new ArrayList<>();
        for (JsonNode nodo : objectMapper.readTree(resultado.getResponse().getContentAsString())) {
            ids.add(nodo.get("id").asLong());
        }
        return ids;
    }
}
