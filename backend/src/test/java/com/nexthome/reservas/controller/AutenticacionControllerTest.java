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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Registro e inicio de sesión")
class AutenticacionControllerTest extends PruebaDeApi {

    // --- Registro (historia #13) --------------------------------------------

    @Test
    @DisplayName("registra un usuario nuevo y devuelve su token")
    void registraUsuarioNuevo() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Marcos",
                                "apellido", "Lancellotti",
                                "email", "marcos@nexthome.com",
                                "password", PASSWORD))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.email").value("marcos@nexthome.com"))
                .andExpect(jsonPath("$.usuario.rol").value("USER"))
                .andExpect(jsonPath("$.usuario.iniciales").value("ML"));

        assertThat(usuarioRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("nunca devuelve la contraseña en la respuesta")
    void nuncaDevuelveLaContrasenia() throws Exception {
        var respuesta = mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Ana", "apellido", "Gómez",
                                "email", "ana@nexthome.com", "password", PASSWORD))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        assertThat(respuesta).doesNotContain(PASSWORD);
        assertThat(respuesta).doesNotContain("password");
    }

    @Test
    @DisplayName("guarda la contraseña hasheada, nunca en texto plano")
    void guardaLaContraseniaHasheada() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Ana", "apellido", "Gómez",
                                "email", "ana@nexthome.com", "password", PASSWORD))))
                .andExpect(status().isCreated());

        Usuario guardado = usuarioRepository.findByEmailIgnoreCase("ana@nexthome.com").orElseThrow();
        assertThat(guardado.getPassword()).isNotEqualTo(PASSWORD);
        assertThat(guardado.getPassword()).startsWith("$2");
    }

    @Test
    @DisplayName("avisa explícitamente si el email ya está registrado")
    void avisaSiElEmailYaExiste() throws Exception {
        crearUsuario("repetido@nexthome.com", Rol.USER);

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Otro", "apellido", "Usuario",
                                "email", "repetido@nexthome.com", "password", PASSWORD))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value(
                        org.hamcrest.Matchers.containsString("Ya existe una cuenta")));

        assertThat(usuarioRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("rechaza el registro con campos vacíos y detalla cuáles")
    void rechazaCamposVacios() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "", "apellido", "", "email", "", "password", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.apellido").exists())
                .andExpect(jsonPath("$.errores.email").exists())
                .andExpect(jsonPath("$.errores.password").exists());

        assertThat(usuarioRepository.count()).isZero();
    }

    @Test
    @DisplayName("rechaza un email con formato inválido")
    void rechazaEmailInvalido() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Ana", "apellido", "Gómez",
                                "email", "esto-no-es-un-email", "password", PASSWORD))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.email").exists());
    }

    @Test
    @DisplayName("rechaza una contraseña demasiado corta")
    void rechazaContraseniaCorta() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Ana", "apellido", "Gómez",
                                "email", "ana@nexthome.com", "password", "corta"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.password").exists());
    }

    // --- Login (historia #14) -----------------------------------------------

    @Test
    @DisplayName("inicia sesión con credenciales válidas y devuelve token y usuario")
    void iniciaSesionConCredencialesValidas() throws Exception {
        crearUsuario("ana@nexthome.com", Rol.USER);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "ana@nexthome.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.email").value("ana@nexthome.com"));
    }

    @Test
    @DisplayName("con la contraseña incorrecta responde 401 sin revelar qué campo falló")
    void rechazaContraseniaIncorrecta() throws Exception {
        crearUsuario("ana@nexthome.com", Rol.USER);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "ana@nexthome.com", "password", "OtraCosa123"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("El email o la contraseña no son correctos"));
    }

    @Test
    @DisplayName("con un email inexistente devuelve exactamente el mismo mensaje")
    void mismoMensajeParaEmailInexistente() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "nadie@nexthome.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("El email o la contraseña no son correctos"));
    }

    // --- Perfil (historia #14: la sesión sobrevive a la recarga) -------------

    @Test
    @DisplayName("con el token devuelve el perfil del usuario identificado")
    void devuelveElPerfilConTokenValido() throws Exception {
        crearUsuario("ana@nexthome.com", Rol.USER);
        String token = tokenDe("ana@nexthome.com");

        mockMvc.perform(get("/api/auth/perfil").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana@nexthome.com"))
                .andExpect(jsonPath("$.iniciales").value("AG"));
    }

    @Test
    @DisplayName("sin token el perfil responde 401")
    void rechazaElPerfilSinToken() throws Exception {
        mockMvc.perform(get("/api/auth/perfil"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un token con la firma adulterada no identifica a nadie")
    void rechazaTokenAdulterado() throws Exception {
        crearUsuario("ana@nexthome.com", Rol.USER);
        String token = tokenDe("ana@nexthome.com");

        // Se cambia el último carácter de la firma: mismo formato, firma inválida.
        char ultimo = token.charAt(token.length() - 1);
        String adulterado = token.substring(0, token.length() - 1) + (ultimo == 'A' ? 'B' : 'A');

        mockMvc.perform(get("/api/auth/perfil")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adulterado)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un token que no es un JWT tampoco identifica a nadie")
    void rechazaTokenSinFormato() throws Exception {
        mockMvc.perform(get("/api/auth/perfil")
                        .header(HttpHeaders.AUTHORIZATION, bearer("esto-no-es-un-token")))
                .andExpect(status().isUnauthorized());
    }

    private String json(Map<String, String> cuerpo) throws Exception {
        return objectMapper.writeValueAsString(cuerpo);
    }
}
