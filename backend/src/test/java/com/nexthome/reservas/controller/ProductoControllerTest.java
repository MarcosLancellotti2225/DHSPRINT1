package com.nexthome.reservas.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.nexthome.reservas.PruebaDeApi;
import com.nexthome.reservas.model.Caracteristica;
import com.nexthome.reservas.model.Categoria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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

@DisplayName("API de productos")
class ProductoControllerTest extends PruebaDeApi {

    private String tokenAdmin;

    @BeforeEach
    void prepararAdministrador() {
        tokenAdmin = tokenDeAdmin();
    }

    // --- Alta de producto (historia #3) -------------------------------------

    @Test
    @DisplayName("crea un producto con sus imágenes y devuelve 201")
    void creaProductoConImagenes() throws Exception {
        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("frente.png"))
                        .file(imagen("pileta.png"))
                        .param("nombre", "Hotel del Valle")
                        .param("descripcion", "Un hotel de montaña con vista al valle.")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nombre").value("Hotel del Valle"))
                .andExpect(jsonPath("$.imagenes.length()").value(2));

        assertThat(productoRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 409 un nombre ya usado, sin importar mayúsculas")
    void rechazaNombreDuplicado() throws Exception {
        crearProducto("Cabaña del Lago");

        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", "cabaña DEL lago")
                        .param("descripcion", "Otra descripción distinta.")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.estado").value(409))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("ya está en uso")));

        // El duplicado no debe haberse guardado.
        assertThat(productoRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza con 400 el alta sin nombre ni descripción")
    void rechazaCamposObligatoriosVacios() throws Exception {
        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", "")
                        .param("descripcion", "")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.descripcion").exists());

        assertThat(productoRepository.count()).isZero();
    }

    @Test
    @DisplayName("rechaza con 400 un archivo que no es una imagen")
    void rechazaArchivoNoImagen() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile(
                "imagenes", "contrato.pdf", MediaType.APPLICATION_PDF_VALUE, new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/productos")
                        .file(pdf)
                        .param("nombre", "Hotel con PDF")
                        .param("descripcion", "No debería crearse.")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isBadRequest());

        assertThat(productoRepository.count()).isZero();
    }

    // --- Protección por rol (historia #16) ----------------------------------

    @Test
    @DisplayName("sin token no se puede dar de alta un producto")
    void rechazaAltaSinToken() throws Exception {
        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", "Hotel Anónimo")
                        .param("descripcion", "No debería crearse."))
                .andExpect(status().isUnauthorized());

        assertThat(productoRepository.count()).isZero();
    }

    @Test
    @DisplayName("un usuario sin rol de administrador no puede dar de alta un producto")
    void rechazaAltaDeUsuarioComun() throws Exception {
        String token = tokenDeUsuarioComun();

        mockMvc.perform(multipart("/api/productos")
                        .file(imagen("foto.png"))
                        .param("nombre", "Hotel del Visitante")
                        .param("descripcion", "No debería crearse.")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());

        assertThat(productoRepository.count()).isZero();
    }

    @Test
    @DisplayName("un usuario sin rol de administrador no puede eliminar un producto")
    void rechazaBajaDeUsuarioComun() throws Exception {
        long id = crearProducto("Hostel de Paso");
        String token = tokenDeUsuarioComun();

        mockMvc.perform(delete("/api/productos/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());

        assertThat(productoRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("el catálogo se puede consultar sin estar identificado")
    void elCatalogoEsPublico() throws Exception {
        crearProducto("Hotel Público");

        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido.length()").value(1));
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

        mockMvc.perform(delete("/api/productos/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(status().isNotFound());

        assertThat(productoRepository.count()).isZero();
    }

    @Test
    @DisplayName("devuelve 404 al intentar eliminar algo que no existe")
    void devuelve404AlEliminarInexistente() throws Exception {
        mockMvc.perform(delete("/api/productos/{id}", 9999)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isNotFound());
    }

    // --- Edición y categorización (historias #12 y #17) ----------------------

    @Test
    @DisplayName("al editar se le puede asignar categoría y características a un producto ya creado")
    void editaAsignandoCategoriaYCaracteristicas() throws Exception {
        long id = crearProducto("Hotel sin Clasificar");
        Categoria categoria = categoriaRepository.save(
                new Categoria("Hoteles", "Con recepción y desayuno.", "/uploads/hoteles.png"));
        Caracteristica wifi = caracteristicaRepository.save(new Caracteristica("Wi-Fi", "wifi"));
        Caracteristica pileta = caracteristicaRepository.save(new Caracteristica("Pileta", "pileta"));

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/productos/{id}", id)
                        .param("nombre", "Hotel Clasificado")
                        .param("descripcion", "Ahora tiene categoría y características.")
                        .param("categoriaId", String.valueOf(categoria.getId()))
                        .param("caracteristicaIds", String.valueOf(wifi.getId()))
                        .param("caracteristicaIds", String.valueOf(pileta.getId()))
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Hotel Clasificado"))
                .andExpect(jsonPath("$.categoria.titulo").value("Hoteles"))
                .andExpect(jsonPath("$.caracteristicas.length()").value(2));

        // Sin imágenes nuevas, se conservan las que ya tenía.
        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(jsonPath("$.imagenes.length()").value(1))
                .andExpect(jsonPath("$.caracteristicas[0].icono").value("pileta"));
    }

    @Test
    @DisplayName("un usuario sin rol de administrador no puede editar un producto")
    void rechazaEdicionDeUsuarioComun() throws Exception {
        long id = crearProducto("Hotel Intocable");
        String token = tokenDeUsuarioComun();

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/productos/{id}", id)
                        .param("nombre", "Otro nombre")
                        .param("descripcion", "Otra descripción.")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());
    }

    // --- Filtrado por categoría (historia #20) ------------------------------

    @Test
    @DisplayName("filtra por categoría y sigue informando el total del catálogo")
    void filtraPorCategoria() throws Exception {
        Categoria hoteles = categoriaRepository.save(
                new Categoria("Hoteles", "Con recepción.", "/uploads/hoteles.png"));
        Categoria cabanias = categoriaRepository.save(
                new Categoria("Cabañas", "En el bosque.", "/uploads/cabanias.png"));

        crearProductoEnCategoria("Hotel Uno", hoteles.getId());
        crearProductoEnCategoria("Hotel Dos", hoteles.getId());
        crearProductoEnCategoria("Cabaña Uno", cabanias.getId());
        crearProducto("Sin categoría");

        mockMvc.perform(get("/api/productos").param("categorias", String.valueOf(hoteles.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido.length()").value(2))
                .andExpect(jsonPath("$.totalElementos").value(2))
                .andExpect(jsonPath("$.totalSinFiltro").value(4));
    }

    @Test
    @DisplayName("se pueden combinar varias categorías en un mismo filtro")
    void filtraPorVariasCategorias() throws Exception {
        Categoria hoteles = categoriaRepository.save(
                new Categoria("Hoteles", "Con recepción.", "/uploads/hoteles.png"));
        Categoria cabanias = categoriaRepository.save(
                new Categoria("Cabañas", "En el bosque.", "/uploads/cabanias.png"));

        crearProductoEnCategoria("Hotel Uno", hoteles.getId());
        crearProductoEnCategoria("Cabaña Uno", cabanias.getId());
        crearProducto("Sin categoría");

        mockMvc.perform(get("/api/productos")
                        .param("categorias", String.valueOf(hoteles.getId()))
                        .param("categorias", String.valueOf(cabanias.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(2))
                .andExpect(jsonPath("$.totalSinFiltro").value(3));
    }

    @Test
    @DisplayName("el filtro por categoría respeta el tope de 10 por página")
    void elFiltroSeCombinaConLaPaginacion() throws Exception {
        Categoria hoteles = categoriaRepository.save(
                new Categoria("Hoteles", "Con recepción.", "/uploads/hoteles.png"));
        for (int i = 1; i <= 12; i++) {
            crearProductoEnCategoria("Hotel " + i, hoteles.getId());
        }

        mockMvc.perform(get("/api/productos")
                        .param("categorias", String.valueOf(hoteles.getId()))
                        .param("page", "0"))
                .andExpect(jsonPath("$.contenido.length()").value(10))
                .andExpect(jsonPath("$.totalPaginas").value(2));

        mockMvc.perform(get("/api/productos")
                        .param("categorias", String.valueOf(hoteles.getId()))
                        .param("page", "1"))
                .andExpect(jsonPath("$.contenido.length()").value(2))
                .andExpect(jsonPath("$.ultima").value(true));
    }

    // --- Utilidades ---------------------------------------------------------

    private MockMultipartFile imagen(String nombreArchivo) {
        return new MockMultipartFile("imagenes", nombreArchivo, MediaType.IMAGE_PNG_VALUE,
                new byte[] {(byte) 0x89, 'P', 'N', 'G'});
    }

    /** Da de alta un producto y devuelve su id. */
    private long crearProducto(String nombre) throws Exception {
        return crearProductoEnCategoria(nombre, null);
    }

    private long crearProductoEnCategoria(String nombre, Long categoriaId) throws Exception {
        var peticion = multipart("/api/productos")
                .file(imagen("foto.png"))
                .param("nombre", nombre)
                .param("descripcion", "Descripción de " + nombre)
                .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin));
        if (categoriaId != null) {
            peticion = peticion.param("categoriaId", String.valueOf(categoriaId));
        }

        MvcResult resultado = mockMvc.perform(peticion)
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
