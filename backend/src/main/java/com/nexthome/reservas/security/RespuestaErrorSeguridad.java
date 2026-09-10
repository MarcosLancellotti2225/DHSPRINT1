package com.nexthome.reservas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexthome.reservas.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Los errores de seguridad se producen en la cadena de filtros, antes de llegar a
 * los controladores, así que el {@code @RestControllerAdvice} no los ve. Esta clase
 * escribe el mismo {@link ErrorResponse} que devuelve el resto de la API para que el
 * frontend pueda tratarlos igual.
 */
final class RespuestaErrorSeguridad {

    private RespuestaErrorSeguridad() {
    }

    static void escribir(HttpServletResponse response, ObjectMapper mapper, HttpStatus estado, String mensaje)
            throws IOException {
        response.setStatus(estado.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        mapper.writeValue(response.getWriter(), new ErrorResponse(estado.value(), mensaje));
    }
}
