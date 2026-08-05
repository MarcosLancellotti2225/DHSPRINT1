package com.nexthome.reservas.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(int estado, String mensaje, Map<String, String> errores) {

    public ErrorResponse(int estado, String mensaje) {
        this(estado, mensaje, null);
    }
}
