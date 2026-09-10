package com.nexthome.reservas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** Respuesta 401 cuando el recurso pedido exige estar identificado y no hay token válido. */
@Component
public class PuntoDeEntradaNoAutenticado implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    public PuntoDeEntradaNoAutenticado(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException excepcion) throws IOException {
        RespuestaErrorSeguridad.escribir(response, mapper, HttpStatus.UNAUTHORIZED,
                "Necesitás iniciar sesión para acceder a este recurso");
    }
}
