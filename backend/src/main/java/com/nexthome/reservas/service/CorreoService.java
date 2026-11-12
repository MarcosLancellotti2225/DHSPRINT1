package com.nexthome.reservas.service;

import com.nexthome.reservas.model.Reserva;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Envía el correo de confirmación de las reservas.
 *
 * <p>Si no hay un SMTP configurado, el correo se escribe en el log en vez de enviarse.
 * Es a propósito: en desarrollo no hay servidor de correo, y una reserva válida no
 * tiene por qué fallar porque no se pueda avisar por mail. El envío va siempre después
 * de que la reserva quedó guardada, y un error de correo nunca la deshace.
 */
@Service
public class CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoService.class);

    private static final DateTimeFormatter FECHA =
            DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", new Locale("es", "AR"));

    private final JavaMailSender remitente;
    private final String desde;
    private final boolean habilitado;

    public CorreoService(JavaMailSender remitente,
                         @Value("${app.correo.desde:no-reply@nexthome.com}") String desde,
                         @Value("${app.correo.habilitado:false}") boolean habilitado) {
        this.remitente = remitente;
        this.desde = desde;
        this.habilitado = habilitado;
    }

    /** Avisa al usuario que su reserva quedó confirmada. */
    public void enviarConfirmacionDeReserva(Reserva reserva) {
        String destinatario = reserva.getUsuario().getEmail();
        String asunto = "Tu reserva en " + reserva.getProducto().getNombre() + " está confirmada";
        String cuerpo = armarCuerpo(reserva);

        if (!habilitado) {
            // Sin SMTP configurado queda registrado, así se puede verificar el contenido
            // en desarrollo y en la corrección del trabajo.
            log.info("Correo de confirmación (envío deshabilitado) para {}:\n{}\n{}",
                    destinatario, asunto, cuerpo);
            return;
        }

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(desde);
            mensaje.setTo(destinatario);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            remitente.send(mensaje);
            log.info("Se envió el correo de confirmación de la reserva {} a {}",
                    reserva.getId(), destinatario);
        } catch (Exception e) {
            // La reserva ya existe: que falle el correo no puede tirar abajo la operación.
            log.error("No se pudo enviar el correo de la reserva {} a {}",
                    reserva.getId(), destinatario, e);
        }
    }

    private String armarCuerpo(Reserva reserva) {
        var usuario = reserva.getUsuario();
        var producto = reserva.getProducto();

        return """
                Hola %s,

                Tu reserva quedó confirmada. Estos son los datos:

                Alojamiento: %s
                Destino: %s
                Check-in: %s
                Check-out: %s
                Noches: %d
                Huéspedes: %d
                Precio por noche: $ %s
                Total: $ %s

                Número de reserva: #%d

                El check-in es a partir de las 14:00 y el check-out hasta las 10:00.
                Si necesitás cambiar algo, respondé este correo.

                Gracias por reservar con NextHome.
                """.formatted(
                usuario.getNombre(),
                producto.getNombre(),
                producto.getCiudad() != null
                        ? producto.getCiudad().getNombre() + ", " + producto.getCiudad().getPais()
                        : "",
                reserva.getEntrada().format(FECHA),
                reserva.getSalida().format(FECHA),
                reserva.getNoches(),
                reserva.getHuespedes(),
                reserva.getPrecioPorNoche().toPlainString(),
                reserva.getTotal().toPlainString(),
                reserva.getId());
    }
}
