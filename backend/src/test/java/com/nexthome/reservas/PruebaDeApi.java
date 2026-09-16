package com.nexthome.reservas;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import com.nexthome.reservas.repository.CaracteristicaRepository;
import com.nexthome.reservas.repository.CategoriaRepository;
import com.nexthome.reservas.repository.ProductoRepository;
import com.nexthome.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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
    protected UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** El orden importa: los productos apuntan a categorías y características. */
    @BeforeEach
    void limpiarBase() {
        productoRepository.deleteAll();
        caracteristicaRepository.deleteAll();
        categoriaRepository.deleteAll();
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
}
