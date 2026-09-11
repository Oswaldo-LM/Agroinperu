import {
  ActualizarProductoDto,
  CrearProductoDto,
  EstadoProducto,
  Producto,
  UnidadMedida
} from '../models/producto.model';

import {
  ProductoRepository
} from '../repositories/producto.repository';

import {
  CategoriaRepository
} from '../repositories/categoria.repository';


export class ProductoService {

  private productoRepository =
    new ProductoRepository();

  private categoriaRepository =
    new CategoriaRepository();


  async listar(): Promise<Producto[]> {

    return this.productoRepository
      .obtenerTodos();
  }


  async obtenerPorId(
    id: number
  ): Promise<Producto> {

    this.validarId(id);

    const producto =
      await this.productoRepository
        .obtenerPorId(id);

    if (!producto) {
      throw new Error(
        'PRODUCTO_NO_ENCONTRADO'
      );
    }

    return producto;
  }


  async obtenerPorCodigo(
    codigo: string
  ): Promise<Producto> {

    const codigoLimpio =
      codigo?.trim();

    if (!codigoLimpio) {
      throw new Error(
        'CODIGO_OBLIGATORIO'
      );
    }

    const producto =
      await this.productoRepository
        .obtenerPorCodigo(codigoLimpio);

    if (!producto) {
      throw new Error(
        'PRODUCTO_NO_ENCONTRADO'
      );
    }

    return producto;
  }


  async crear(
    datos: CrearProductoDto
  ): Promise<Producto> {

    await this.validarCategoria(
      datos.categoria_id
    );

    const codigo =
      this.validarCodigo(datos.codigo);

    const nombre =
      this.validarNombre(datos.nombre);

    const descripcion =
      this.validarDescripcion(
        datos.descripcion
      );

    this.validarUnidadMedida(
      datos.unidad_medida
    );

    this.validarPrecio(
      datos.precio
    );

    const stockDisponible =
      datos.stock_disponible ?? 0;

    const stockMinimo =
      datos.stock_minimo ?? 0;

    this.validarStock(
      stockDisponible,
      'STOCK_DISPONIBLE_INVALIDO'
    );

    this.validarStock(
      stockMinimo,
      'STOCK_MINIMO_INVALIDO'
    );

    this.validarImagenUrl(
      datos.imagen_url
    );

    const existente =
      await this.productoRepository
        .obtenerPorCodigo(codigo);

    if (existente) {
      throw new Error(
        'CODIGO_PRODUCTO_DUPLICADO'
      );
    }

    return this.productoRepository.crear({
      categoria_id: datos.categoria_id,
      codigo,
      nombre,
      descripcion,
      unidad_medida:
        datos.unidad_medida,
      precio: Number(datos.precio),
      stock_disponible:
        Number(stockDisponible),
      stock_minimo:
        Number(stockMinimo),
      imagen_url:
        datos.imagen_url?.trim() || null,
      visible_web:
        datos.visible_web ?? true
    });
  }


  async actualizar(
    id: number,
    datos: ActualizarProductoDto
  ): Promise<Producto> {

    this.validarId(id);

    const productoActual =
      await this.productoRepository
        .obtenerPorId(id);

    if (!productoActual) {
      throw new Error(
        'PRODUCTO_NO_ENCONTRADO'
      );
    }

    await this.validarCategoria(
      datos.categoria_id
    );

    const codigo =
      this.validarCodigo(datos.codigo);

    const nombre =
      this.validarNombre(datos.nombre);

    const descripcion =
      this.validarDescripcion(
        datos.descripcion
      );

    this.validarUnidadMedida(
      datos.unidad_medida
    );

    this.validarPrecio(
      datos.precio
    );

    this.validarStock(
      datos.stock_minimo,
      'STOCK_MINIMO_INVALIDO'
    );

    this.validarEstado(
      datos.estado
    );

    this.validarImagenUrl(
      datos.imagen_url
    );

    if (
      typeof datos.visible_web
      !== 'boolean'
    ) {
      throw new Error(
        'VISIBLE_WEB_INVALIDO'
      );
    }

    const productoConCodigo =
      await this.productoRepository
        .obtenerPorCodigo(
          codigo,
          id
        );

    if (productoConCodigo) {
      throw new Error(
        'CODIGO_PRODUCTO_DUPLICADO'
      );
    }

    const actualizado =
      await this.productoRepository
        .actualizar(
          id,
          {
            categoria_id:
              datos.categoria_id,

            codigo,

            nombre,

            descripcion,

            unidad_medida:
              datos.unidad_medida,

            precio:
              Number(datos.precio),

            stock_minimo:
              Number(datos.stock_minimo),

            imagen_url:
              datos.imagen_url?.trim()
              || null,

            visible_web:
              datos.visible_web,

            estado:
              datos.estado
          }
        );

    if (!actualizado) {
      throw new Error(
        'ERROR_ACTUALIZAR_PRODUCTO'
      );
    }

    return actualizado;
  }


  async desactivar(
    id: number
  ): Promise<void> {

    this.validarId(id);

    const producto =
      await this.productoRepository
        .obtenerPorId(id);

    if (!producto) {
      throw new Error(
        'PRODUCTO_NO_ENCONTRADO'
      );
    }

    if (
      producto.estado === 'INACTIVO'
    ) {
      throw new Error(
        'PRODUCTO_YA_INACTIVO'
      );
    }

    await this.productoRepository
      .desactivar(id);
  }


  private async validarCategoria(
    categoriaId: number
  ): Promise<void> {

    this.validarId(categoriaId);

    const categoria =
      await this.categoriaRepository
        .obtenerPorId(categoriaId);

    if (!categoria) {
      throw new Error(
        'CATEGORIA_NO_ENCONTRADA'
      );
    }

    if (
      categoria.estado !== 'ACTIVO'
    ) {
      throw new Error(
        'CATEGORIA_INACTIVA'
      );
    }
  }


  private validarCodigo(
    codigo: string
  ): string {

    const codigoLimpio =
      codigo?.trim();

    if (!codigoLimpio) {
      throw new Error(
        'CODIGO_OBLIGATORIO'
      );
    }

    if (codigoLimpio.length > 30) {
      throw new Error(
        'CODIGO_MUY_LARGO'
      );
    }

    return codigoLimpio;
  }


  private validarNombre(
    nombre: string
  ): string {

    const nombreLimpio =
      nombre?.trim();

    if (!nombreLimpio) {
      throw new Error(
        'NOMBRE_OBLIGATORIO'
      );
    }

    if (nombreLimpio.length < 2) {
      throw new Error(
        'NOMBRE_MUY_CORTO'
      );
    }

    if (nombreLimpio.length > 150) {
      throw new Error(
        'NOMBRE_MUY_LARGO'
      );
    }

    return nombreLimpio;
  }


  private validarDescripcion(
    descripcion?: string | null
  ): string | null {

    const valor =
      descripcion?.trim() || null;

    if (
      valor &&
      valor.length > 500
    ) {
      throw new Error(
        'DESCRIPCION_MUY_LARGA'
      );
    }

    return valor;
  }


  private validarUnidadMedida(
    unidad: UnidadMedida
  ): void {

    const unidades: UnidadMedida[] = [
      'UNIDAD',
      'METRO',
      'ROLLO',
      'CAJA'
    ];

    if (!unidades.includes(unidad)) {
      throw new Error(
        'UNIDAD_MEDIDA_INVALIDA'
      );
    }
  }


  private validarPrecio(
    precio: number
  ): void {

    if (
      typeof precio !== 'number' ||
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      throw new Error(
        'PRECIO_INVALIDO'
      );
    }
  }


  private validarStock(
    stock: number,
    error: string
  ): void {

    if (
      typeof stock !== 'number' ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      throw new Error(error);
    }
  }


  private validarEstado(
    estado: EstadoProducto
  ): void {

    const estados:
      EstadoProducto[] = [
        'ACTIVO',
        'INACTIVO'
      ];

    if (!estados.includes(estado)) {
      throw new Error(
        'ESTADO_INVALIDO'
      );
    }
  }


  private validarImagenUrl(
    imagen?: string | null
  ): void {

    if (
      imagen &&
      imagen.length > 255
    ) {
      throw new Error(
        'IMAGEN_URL_MUY_LARGA'
      );
    }
  }


  private validarId(
    id: number
  ): void {

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        'ID_INVALIDO'
      );
    }
  }

  async listarPublicos() {

  return this.productoRepository
    .listarPublicos();
}

async obtenerPublicoPorId(
  id: number
) {

  this.validarId(id);


  const producto =
    await this.productoRepository
      .obtenerPublicoPorId(id);


  if (!producto) {

    throw new Error(
      'PRODUCTO_NO_ENCONTRADO'
    );
  }


  return producto;
}

async obtenerPorCodigoBarras(
  codigoBarras: string
) {

  const codigo =
    codigoBarras?.trim();

  if (!codigo) {

    throw new Error(
      'CODIGO_BARRAS_REQUERIDO'
    );
  }

  const producto =
    await this.productoRepository
      .obtenerPorCodigoBarras(
        codigo
      );

  if (!producto) {

    throw new Error(
      'PRODUCTO_NO_ENCONTRADO'
    );
  }

  return producto;
}

}

