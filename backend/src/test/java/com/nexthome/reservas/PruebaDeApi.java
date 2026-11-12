package com.nexthome.reservas;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexthome.reservas.model.Caracteristica;
import com.nexthome.reservas.model.Categoria;
import com.nexthome.reservas.model.Ciudad;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.CaracteristicaRepository;
import com.nexthome.reservas.repository.CategoriaRepository;
import com.nexthome.reservas.repository.CiudadRepository;
import com.nexthome.reservas.repository.FavoritoRepository;
import com.nexthome.reservas.repository.ReservaRepository;
import com.nexthome.reservas.repository.ValoracionRepository;
import com.nexthome.reservas.repository.ProductoRepository;
import com.nexthome.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base común de las pruebas de la API: deja la base limpia antes de cada test y
 * ofrece atajos para crear usuarios y obtener sus tokens.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class PruebaDeApi {

    protected static final String PASSWORD = "Secreta1234";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected ProductoRepository productoRepository;

    @Autowired
    protected CategoriaRepository categoriaRepository;

    @Autowired
    protected CaracteristicaRepository caracteristicaRepository;

    @Autowired
    protected CiudadRepository ciudadRepository;

    @Autowired
    protected FavoritoRepository favoritoRepository;

    @Autowired
    protected ReservaRepository reservaRepository;

    @Autowired
    protected ValoracionRepository valoracionRepository;

    @Autowired
    protected UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** El orden importa: los productos apuntan a categorías y características. */
    @BeforeEach
    void limpiarBase() {
        valoracionRepository.deleteAll();
        reservaRepository.deleteAll();
        favoritoRepository.deleteAll();
        productoRepository.deleteAll();
        caracteristicaRepository.deleteAll();
        categoriaRepository.deleteAll();
        ciudadRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    protected Usuario crearUsuario(String email, Rol rol) {
        return usuarioRepository.save(
                new Usuario("Ana", "Gómez", email, passwordEncoder.encode(PASSWORD), rol));
    }

    protected String tokenDeAdmin() {
        return tokenDe(crearUsuario("admin@nexthome.com", Rol.ADMIN).getEmail());
    }

    protected String tokenDeUsuarioComun() {
        return tokenDe(crearUsuario("visitante@nexthome.com", Rol.USER).getEmail());
    }

    /** Hace login de verdad contra la API, así los tests usan un token real. */
    protected String tokenDe(String email) {
        try {
            String cuerpo = objectMapper.writeValueAsString(java.util.Map.of("email", email, "password", PASSWORD));
            MvcResult resultado = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(cuerpo))
                    .andExpect(status().isOk())
                    .andReturn();
            return objectMapper.readTree(resultado.getResponse().getContentAsString()).get("token").asText();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo obtener el token de " + email, e);
        }
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }

    /** Imagen mínima para los formularios multipart. */
    protected MockMultipartFile imagenDePrueba() {
        return new MockMultipartFile("imagenes", "foto.png", MediaType.IMAGE_PNG_VALUE,
                new byte[] {(byte) 0x89, 'P', 'N', 'G'});
    }

    /**
     * Da de alta un producto válido y devuelve su id. Ciudad y categoría son
     * obligatorias, así que el helper las crea si hacen falta: sin ellas el
     * alojamiento no entraría en ninguna búsqueda.
     */
    /** Precio por noche de los productos de prueba que no fijan uno propio. */
    protected static final String PRECIO_DE_PRUEBA = "50000.00";

    protected long crearProductoDePrueba(String nombre, String token) throws Exception {
        return crearProductoDePrueba(nombre, token, null, null, 4);
    }

    protected long crearProductoDePrueba(String nombre, String token, Long ciudadId,
                                         Long categoriaId, int capacidad) throws Exception {
        return crearProductoDePrueba(nombre, token, ciudadId, categoriaId, capacidad,
                PRECIO_DE_PRUEBA, List.of());
    }

    /** Con precio y características, para los tests que filtran por esos campos. */
    protected long crearProductoDePrueba(String nombre, String token, Long ciudadId,
                                         Long categoriaId, int capacidad, String precioPorNoche,
                                         List<Long> caracteristicaIds) throws Exception {
        Long ciudad = ciudadId != null ? ciudadId : ciudadPorDefecto().getId();
        Long categoria = categoriaId != null ? categoriaId : categoriaPorDefecto().getId();

        var peticion = multipart("/api/productos")
                .file(imagenDePrueba())
                .param("nombre", nombre)
                .param("descripcion", "Descripción de prueba de " + nombre + ", con largo suficiente.")
                .param("capacidad", String.valueOf(capacidad))
                .param("precioPorNoche", precioPorNoche)
                .param("ciudadId", String.valueOf(ciudad))
                .param("categoriaId", String.valueOf(categoria));

        for (Long caracteristica : caracteristicaIds) {
            peticion = peticion.param("caracteristicaIds", String.valueOf(caracteristica));
        }

        var resultado = mockMvc.perform(peticion
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andReturn();

        if (resultado.getResponse().getStatus() != 201) {
            throw new IllegalStateException("No se pudo crear el producto de prueba: "
                    + resultado.getResponse().getContentAsString());
        }
        return objectMapper.readTree(resultado.getResponse().getContentAsString()).get("id").asLong();
    }

    /** Ciudad de relleno, reutilizada si ya existe. */
    protected Ciudad ciudadPorDefecto() {
        return ciudadRepository.findByNombreIgnoreCase("Bariloche")
                .orElseGet(() -> ciudadRepository.save(new Ciudad("Bariloche", "Argentina")));
    }

    protected Categoria categoriaPorDefecto() {
        return categoriaRepository.findByTituloIgnoreCase("Cabañas")
                .orElseGet(() -> categoriaRepository.save(
                        new Categoria("Cabañas", "En el bosque.", "/uploads/c.png")));
    }

    protected Caracteristica caracteristicaPorDefecto() {
        return caracteristicaRepository.findByNombreIgnoreCase("Wi-Fi")
                .orElseGet(() -> caracteristicaRepository.save(new Caracteristica("Wi-Fi", "wifi")));
    }
}
