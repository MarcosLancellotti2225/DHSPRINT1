package com.nexthome.reservas.service;

import com.nexthome.reservas.model.Categoria;
import com.nexthome.reservas.model.Ciudad;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.Reserva;
import com.nexthome.reservas.model.Rol;
import com.nexthome.reservas.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * El correo no se prueba contra un SMTP real: se verifica qué mensaje se arma y que
 * un fallo de envío nunca tumbe la reserva, que es lo que importa.
 */
class CorreoServiceTest {

    /** Remitente de mentira que guarda lo que se le pide enviar. */
    private static class RemitenteDePrueba implements JavaMailSender {
        private final List<SimpleMailMessage> enviados = new ArrayList<>();
        private boolean falla = false;

        @Override
        public void send(SimpleMailMessage... mensajes) {
            if (falla) throw new MailSendException("sin conexión con el servidor");
            enviados.addAll(List.of(mensajes));
        }

        @Override
        public jakarta.mail.internet.MimeMessage createMimeMessage() {
            throw new UnsupportedOperationException();
        }

        @Override
        public jakarta.mail.internet.MimeMessage createMimeMessage(java.io.InputStream entrada) {
            throw new UnsupportedOperationException();
        }

        @Override
        public void send(jakarta.mail.internet.MimeMessage... mensajes) {
            throw new UnsupportedOperationException();
        }
    }

    private Reserva reservaDePrueba() {
        Producto producto = new Producto();
        producto.setNombre("Cabaña del Lago");
        producto.setDescripcion("Una cabaña junto al lago, con vista despejada.");
        producto.setCapacidad(6);
        producto.setPrecioPorNoche(new BigDecimal("50000.00"));
        producto.setCiudad(new Ciudad("Bariloche", "Argentina"));
        producto.setCategoria(new Categoria("Cabañas", "En el bosque.", "/uploads/c.png"));

        Usuario usuario = new Usuario("Ana", "García", "ana@ejemplo.com", "hash", Rol.USER);

        return new Reserva(producto, usuario,
                LocalDate.of(2026, 12, 10), LocalDate.of(2026, 12, 13), 2);
    }

    @Test
    void sinSmtpConfiguradoNoEnviaNada() {
        var remitente = new RemitenteDePrueba();
        var servicio = new CorreoService(remitente, "no-reply@nexthome.com", false);

        servicio.enviarConfirmacionDeReserva(reservaDePrueba());

        assertThat(remitente.enviados).isEmpty();
    }

    @Test
    void habilitadoEnviaElDetalleDeLaReserva() {
        var remitente = new RemitenteDePrueba();
        var servicio = new CorreoService(remitente, "no-reply@nexthome.com", true);

        servicio.enviarConfirmacionDeReserva(reservaDePrueba());

        assertThat(remitente.enviados).hasSize(1);
        SimpleMailMessage mensaje = remitente.enviados.get(0);
        assertThat(mensaje.getTo()).containsExactly("ana@ejemplo.com");
        assertThat(mensaje.getSubject()).contains("Cabaña del Lago");
        assertThat(mensaje.getText())
                .contains("Ana")
                .contains("Cabaña del Lago")
                .contains("Bariloche, Argentina")
                // Tres noches a 50.000 son 150.000.
                .contains("150000.00");
    }

    @Test
    void unFalloDeCorreoNoRompeLaReserva() {
        var remitente = new RemitenteDePrueba();
        remitente.falla = true;
        var servicio = new CorreoService(remitente, "no-reply@nexthome.com", true);

        // La reserva ya está guardada cuando se llama a esto: tirar acá la perdería.
        assertThatCode(() -> servicio.enviarConfirmacionDeReserva(reservaDePrueba()))
                .doesNotThrowAnyException();
    }
}
