package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.PaginaResponse;
import com.nexthome.reservas.dto.ProductoRequest;
import com.nexthome.reservas.dto.ProductoResponse;
import com.nexthome.reservas.exception.NombreDuplicadoException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.ProductoImagen;
import com.nexthome.reservas.repository.ProductoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    /** Tope de productos por página exigido por el requerimiento. */
    public static final int TAMANIO_MAXIMO_PAGINA = 10;

    private final ProductoRepository repository;
    private final AlmacenamientoService almacenamiento;
    private final SecureRandom random = new SecureRandom();

    public ProductoService(ProductoRepository repository, AlmacenamientoService almacenamiento) {
        this.repository = repository;
        this.almacenamiento = almacenamiento;
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCase(nombre)) {
            throw new NombreDuplicadoException(nombre);
        }

        Producto producto = new Producto(nombre, request.getDescripcion().trim());

        List<String> urlsGuardadas = new ArrayList<>();
        try {
            for (MultipartFile archivo : request.getImagenes()) {
                if (archivo == null || archivo.isEmpty()) {
                    continue;
                }
                String url = almacenamiento.guardar(archivo);
                urlsGuardadas.add(url);
                producto.agregarImagen(new ProductoImagen(url));
            }
            if (producto.getImagenes().isEmpty()) {
                throw new IllegalArgumentException("Se debe cargar al menos una imagen");
            }
            return ProductoResponse.desde(repository.save(producto));
        } catch (RuntimeException e) {
            // Si algo falla después de haber copiado archivos, no dejamos huérfanos en disco.
            urlsGuardadas.forEach(almacenamiento::eliminar);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ProductoResponse> listarPaginado(int pagina, int tamanio) {
        int paginaSegura = Math.max(pagina, 0);
        int tamanioSeguro = Math.clamp(tamanio, 1, TAMANIO_MAXIMO_PAGINA);

        Page<Long> paginaDeIds = repository.buscarPaginaDeIds(
                PageRequest.of(paginaSegura, tamanioSeguro, Sort.by(Sort.Direction.DESC, "id")));

        List<ProductoResponse> contenido = hidratarEnOrden(paginaDeIds.getContent());
        return PaginaResponse.de(contenido, paginaSegura, tamanioSeguro, paginaDeIds.getTotalElements());
    }

    /**
     * Selección aleatoria real y sin repetidos: se barajan todos los ids con
     * {@link SecureRandom} y se toman los primeros {@code limite}.
     */
    @Transactional(readOnly = true)
    public List<ProductoResponse> listarAleatorios(int limite) {
        int limiteSeguro = Math.clamp(limite, 1, TAMANIO_MAXIMO_PAGINA);

        List<Long> ids = new ArrayList<>(repository.buscarTodosLosIds());
        Collections.shuffle(ids, random);

        List<Long> seleccionados = ids.subList(0, Math.min(limiteSeguro, ids.size()));
        return hidratarEnOrden(seleccionados);
    }

    @Transactional(readOnly = true)
    public ProductoResponse buscarPorId(Long id) {
        return repository.buscarPorIdConImagenes(id)
                .map(ProductoResponse::desde)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));
    }

    @Transactional
    public void eliminar(Long id) {
        Producto producto = repository.buscarPorIdConImagenes(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));

        List<String> urls = producto.getImagenes().stream().map(ProductoImagen::getUrl).toList();
        repository.delete(producto);
        urls.forEach(almacenamiento::eliminar);
    }

    /** Carga los productos de una lista de ids respetando el orden recibido. */
    private List<ProductoResponse> hidratarEnOrden(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Producto> porId = repository.buscarPorIdsConImagenes(ids).stream()
                .collect(Collectors.toMap(Producto::getId, Function.identity()));

        return ids.stream()
                .map(porId::get)
                .filter(java.util.Objects::nonNull)
                .map(ProductoResponse::desde)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
