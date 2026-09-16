package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.PaginaResponse;
import com.nexthome.reservas.dto.ProductoEdicionRequest;
import com.nexthome.reservas.dto.ProductoRequest;
import com.nexthome.reservas.dto.ProductoResponse;
import com.nexthome.reservas.exception.NombreDuplicadoException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Caracteristica;
import com.nexthome.reservas.model.Categoria;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.ProductoImagen;
import com.nexthome.reservas.repository.CaracteristicaRepository;
import com.nexthome.reservas.repository.CategoriaRepository;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    /** Tope de productos por página exigido por el requerimiento. */
    public static final int TAMANIO_MAXIMO_PAGINA = 10;

    private final ProductoRepository repository;
    private final CategoriaRepository categoriaRepository;
    private final CaracteristicaRepository caracteristicaRepository;
    private final AlmacenamientoService almacenamiento;
    private final SecureRandom random = new SecureRandom();

    public ProductoService(ProductoRepository repository,
                           CategoriaRepository categoriaRepository,
                           CaracteristicaRepository caracteristicaRepository,
                           AlmacenamientoService almacenamiento) {
        this.repository = repository;
        this.categoriaRepository = categoriaRepository;
        this.caracteristicaRepository = caracteristicaRepository;
        this.almacenamiento = almacenamiento;
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCase(nombre)) {
            throw NombreDuplicadoException.deProducto(nombre);
        }

        Producto producto = new Producto(nombre, request.getDescripcion().trim());
        producto.setCategoria(resolverCategoria(request.getCategoriaId()));
        producto.setCaracteristicas(resolverCaracteristicas(request.getCaracteristicaIds()));

        List<String> urlsGuardadas = new ArrayList<>();
        try {
            for (ProductoImagen imagen : guardarImagenes(request.getImagenes(), urlsGuardadas)) {
                producto.agregarImagen(imagen);
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

    /**
     * Edición de un producto ya publicado.
     *
     * Las imágenes son opcionales: si no vienen, se conservan las actuales; si vienen,
     * reemplazan por completo a las anteriores y las viejas se borran del disco.
     */
    @Transactional
    public ProductoResponse actualizar(Long id, ProductoEdicionRequest request) {
        Producto producto = repository.buscarPorIdConImagenes(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));

        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw NombreDuplicadoException.deProducto(nombre);
        }

        producto.setNombre(nombre);
        producto.setDescripcion(request.getDescripcion().trim());
        producto.setCategoria(resolverCategoria(request.getCategoriaId()));
        producto.setCaracteristicas(resolverCaracteristicas(request.getCaracteristicaIds()));

        List<String> urlsGuardadas = new ArrayList<>();
        try {
            List<ProductoImagen> nuevas = guardarImagenes(request.getImagenes(), urlsGuardadas);
            List<String> urlsAnteriores = producto.getImagenes().stream().map(ProductoImagen::getUrl).toList();

            if (!nuevas.isEmpty()) {
                producto.reemplazarImagenes(nuevas);
            }

            Producto guardado = repository.save(producto);
            if (!nuevas.isEmpty()) {
                urlsAnteriores.forEach(almacenamiento::eliminar);
            }
            return ProductoResponse.desde(guardado);
        } catch (RuntimeException e) {
            urlsGuardadas.forEach(almacenamiento::eliminar);
            throw e;
        }
    }

    /**
     * Listado paginado del catálogo, opcionalmente acotado a un conjunto de categorías.
     * El filtro se resuelve en la base junto con la paginación, no en memoria.
     */
    @Transactional(readOnly = true)
    public PaginaResponse<ProductoResponse> listarPaginado(int pagina, int tamanio, List<Long> categoriaIds) {
        int paginaSegura = Math.max(pagina, 0);
        int tamanioSeguro = Math.clamp(tamanio, 1, TAMANIO_MAXIMO_PAGINA);
        var orden = PageRequest.of(paginaSegura, tamanioSeguro, Sort.by(Sort.Direction.DESC, "id"));

        boolean hayFiltro = categoriaIds != null && !categoriaIds.isEmpty();
        Page<Long> paginaDeIds = hayFiltro
                ? repository.buscarPaginaDeIdsPorCategorias(categoriaIds, orden)
                : repository.buscarPaginaDeIds(orden);

        long totalSinFiltro = hayFiltro ? repository.count() : paginaDeIds.getTotalElements();

        List<ProductoResponse> contenido = hidratarEnOrden(paginaDeIds.getContent());
        return PaginaResponse.de(
                contenido, paginaSegura, tamanioSeguro, paginaDeIds.getTotalElements(), totalSinFiltro);
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
        Producto producto = repository.buscarPorIdConImagenes(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));
        // Completa categoría y características sobre la misma entidad ya cargada.
        repository.buscarPorIdsConCaracteristicas(List.of(id));
        return ProductoResponse.desde(producto);
    }

    @Transactional
    public void eliminar(Long id) {
        Producto producto = repository.buscarPorIdConImagenes(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));

        List<String> urls = producto.getImagenes().stream().map(ProductoImagen::getUrl).toList();
        repository.delete(producto);
        urls.forEach(almacenamiento::eliminar);
    }

    /** Copia los archivos a disco y devuelve las imágenes listas para asociar. */
    private List<ProductoImagen> guardarImagenes(List<MultipartFile> archivos, List<String> urlsGuardadas) {
        List<ProductoImagen> imagenes = new ArrayList<>();
        if (archivos == null) {
            return imagenes;
        }
        for (MultipartFile archivo : archivos) {
            if (archivo == null || archivo.isEmpty()) {
                continue;
            }
            String url = almacenamiento.guardar(archivo);
            urlsGuardadas.add(url);
            imagenes.add(new ProductoImagen(url));
        }
        return imagenes;
    }

    private Categoria resolverCategoria(Long categoriaId) {
        if (categoriaId == null) {
            return null;
        }
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una categoría con id " + categoriaId));
    }

    private Set<Caracteristica> resolverCaracteristicas(List<Long> ids) {
        Set<Caracteristica> caracteristicas = new LinkedHashSet<>();
        if (ids == null) {
            return caracteristicas;
        }
        for (Long id : ids) {
            if (id == null) {
                continue;
            }
            caracteristicas.add(caracteristicaRepository.findById(id).orElseThrow(
                    () -> new RecursoNoEncontradoException("No existe una característica con id " + id)));
        }
        return caracteristicas;
    }

    /** Carga los productos de una lista de ids respetando el orden recibido. */
    private List<ProductoResponse> hidratarEnOrden(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Producto> porId = repository.buscarPorIdsConImagenes(ids).stream()
                .collect(Collectors.toMap(Producto::getId, Function.identity()));
        // Segunda pasada: completa categoría y características sobre las mismas entidades.
        repository.buscarPorIdsConCaracteristicas(ids);

        return ids.stream()
                .map(porId::get)
                .filter(java.util.Objects::nonNull)
                .map(ProductoResponse::desde)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
