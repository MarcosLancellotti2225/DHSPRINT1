package com.nexthome.reservas.service;

import com.nexthome.reservas.dto.PaginaResponse;
import com.nexthome.reservas.dto.ProductoEdicionRequest;
import com.nexthome.reservas.dto.ProductoRequest;
import com.nexthome.reservas.dto.ProductoResponse;
import com.nexthome.reservas.exception.NombreDuplicadoException;
import com.nexthome.reservas.exception.RecursoNoEncontradoException;
import com.nexthome.reservas.model.Caracteristica;
import com.nexthome.reservas.model.Categoria;
import com.nexthome.reservas.model.Ciudad;
import com.nexthome.reservas.model.Producto;
import com.nexthome.reservas.model.ProductoImagen;
import com.nexthome.reservas.repository.CaracteristicaRepository;
import com.nexthome.reservas.repository.CategoriaRepository;
import com.nexthome.reservas.repository.CiudadRepository;
import com.nexthome.reservas.repository.FavoritoRepository;
import com.nexthome.reservas.repository.ReservaRepository;
import com.nexthome.reservas.repository.ValoracionRepository;

import java.time.LocalDate;
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
    private final CiudadRepository ciudadRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReservaRepository reservaRepository;
    private final ValoracionRepository valoracionRepository;
    private final CaracteristicaRepository caracteristicaRepository;
    private final AlmacenamientoService almacenamiento;
    private final SecureRandom random = new SecureRandom();

    public ProductoService(ProductoRepository repository,
                           CategoriaRepository categoriaRepository,
                           CiudadRepository ciudadRepository,
                           FavoritoRepository favoritoRepository,
                           ReservaRepository reservaRepository,
                           ValoracionRepository valoracionRepository,
                           CaracteristicaRepository caracteristicaRepository,
                           AlmacenamientoService almacenamiento) {
        this.repository = repository;
        this.categoriaRepository = categoriaRepository;
        this.ciudadRepository = ciudadRepository;
        this.favoritoRepository = favoritoRepository;
        this.reservaRepository = reservaRepository;
        this.valoracionRepository = valoracionRepository;
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
        producto.setCiudad(resolverCiudad(request.getCiudadId()));
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
        producto.setCiudad(resolverCiudad(request.getCiudadId()));
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
    public PaginaResponse<ProductoResponse> listarPaginado(
            int pagina, int tamanio, Long ciudadId, List<Long> categoriaIds,
            LocalDate entrada, LocalDate salida) {
        int paginaSegura = Math.max(pagina, 0);
        int tamanioSeguro = Math.clamp(tamanio, 1, TAMANIO_MAXIMO_PAGINA);
        var orden = PageRequest.of(paginaSegura, tamanioSeguro, Sort.by(Sort.Direction.DESC, "id"));

        boolean sinFiltroDeCategorias = categoriaIds == null || categoriaIds.isEmpty();
        // El in necesita una lista no vacía aunque la bandera lo desactive.
        List<Long> categorias = sinFiltroDeCategorias ? List.of(-1L) : categoriaIds;

        // Sólo se filtra por fechas con el rango completo y coherente; media fecha no
        // alcanza para saber qué está ocupado.
        boolean sinFiltroDeFechas = entrada == null || salida == null || !salida.isAfter(entrada);
        List<Long> ocupados = sinFiltroDeFechas
                ? List.of(-1L)
                : reservaRepository.buscarIdsOcupados(entrada, salida);
        if (!sinFiltroDeFechas && ocupados.isEmpty()) {
            ocupados = List.of(-1L);
        }

        Page<Long> paginaDeIds = repository.buscarPagina(
                ciudadId, sinFiltroDeCategorias, categorias, sinFiltroDeFechas, ocupados, orden);

        // El total de referencia es el del destino elegido: dentro de una búsqueda,
        // comparar contra el catálogo entero no le diría nada al usuario.
        long totalSinFiltro = sinFiltroDeCategorias && sinFiltroDeFechas
                ? paginaDeIds.getTotalElements()
                : (ciudadId == null ? repository.count() : repository.countByCiudadId(ciudadId));

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

        Double promedio = valoracionRepository.promedioDe(id);
        return ProductoResponse.desde(
                producto,
                promedio == null ? 0 : Math.round(promedio * 10) / 10.0,
                valoracionRepository.countByProductoId(id));
    }

    @Transactional
    public void eliminar(Long id) {
        Producto producto = repository.buscarPorIdConImagenes(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));

        List<String> urls = producto.getImagenes().stream().map(ProductoImagen::getUrl).toList();
        // Sin esto la baja falla por la clave foránea de favoritos.
        favoritoRepository.eliminarPorProducto(id);
        reservaRepository.eliminarPorProducto(id);
        valoracionRepository.eliminarPorProducto(id);
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

    private Ciudad resolverCiudad(Long ciudadId) {
        if (ciudadId == null) {
            return null;
        }
        return ciudadRepository.findById(ciudadId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una ciudad con id " + ciudadId));
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
    @Transactional(readOnly = true)
    public List<ProductoResponse> hidratarEnOrden(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Producto> porId = repository.buscarPorIdsConImagenes(ids).stream()
                .collect(Collectors.toMap(Producto::getId, Function.identity()));
        // Segunda pasada: completa categoría y características sobre las mismas entidades.
        repository.buscarPorIdsConCaracteristicas(ids);

        // Promedio y cantidad de estrellas de todos los productos en una sola consulta.
        Map<Long, double[]> puntuaciones = new java.util.HashMap<>();
        for (Object[] fila : valoracionRepository.resumenDe(ids)) {
            puntuaciones.put((Long) fila[0],
                    new double[] {((Number) fila[1]).doubleValue(), ((Number) fila[2]).doubleValue()});
        }

        return ids.stream()
                .map(porId::get)
                .filter(java.util.Objects::nonNull)
                .map(producto -> {
                    double[] resumen = puntuaciones.get(producto.getId());
                    return resumen == null
                            ? ProductoResponse.desde(producto)
                            : ProductoResponse.desde(
                                    producto, Math.round(resumen[0] * 10) / 10.0, (long) resumen[1]);
                })
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
