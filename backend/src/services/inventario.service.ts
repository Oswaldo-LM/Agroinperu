import {
  pool
} from '../config/database';

import {
  MovimientoStock,
  RegistrarAjusteDto,
  RegistrarEntradaDto,
  ResultadoInventario
} from '../models/inventario.model';

import {
  InventarioRepository,
  ProductoStockRow
} from '../repositories/inventario.repository';


export class InventarioService {

  private inventarioRepository =
    new InventarioRepository();


  /*
  |--------------------------------------------------------------------------
  | Registrar entrada
  |--------------------------------------------------------------------------
  */

  async registrarEntrada(
    usuarioId: number,
    datos: RegistrarEntradaDto
  ): Promise<ResultadoInventario> {

    this.validarId(
      usuarioId
    );


    if (!datos) {

      throw new Error(
        'DATOS_ENTRADA_OBLIGATORIOS'
      );
    }


    const productoId =
      Number(
        datos.producto_id
      );


    const cantidad =
      Number(
        datos.cantidad
      );


    this.validarId(
      productoId
    );


    this.validarCantidad(
      cantidad
    );


    const motivo =
      this.validarMotivo(
        datos.motivo
      );


    const connection =
      await pool.getConnection();


    try {

      await connection
        .beginTransaction();


      /*
      |--------------------------------------------------------------------------
      | Bloquear producto
      |--------------------------------------------------------------------------
      */

      const producto =
        await this.inventarioRepository
          .obtenerProductoConBloqueo(
            connection,
            productoId
          );


      if (!producto) {

        throw new Error(
          'PRODUCTO_NO_ENCONTRADO'
        );
      }


      if (
        producto.estado !==
        'ACTIVO'
      ) {

        throw new Error(
          'PRODUCTO_INACTIVO'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Validar cantidad según unidad
      |--------------------------------------------------------------------------
      */

      this.validarCantidadProducto(
        producto,
        cantidad
      );


      const disponibleAnterior =
        Number(
          producto.stock_disponible
        );


      const reservadoActual =
        Number(
          producto.stock_reservado
        );


      const disponibleNuevo =
        this.redondear(
          disponibleAnterior +
          cantidad
        );


      /*
      |--------------------------------------------------------------------------
      | Actualizar producto
      |--------------------------------------------------------------------------
      */

      await this.inventarioRepository
        .actualizarStockDisponible(
          connection,

          productoId,

          disponibleNuevo
        );


      /*
      |--------------------------------------------------------------------------
      | Movimiento
      |--------------------------------------------------------------------------
      */

      await this.inventarioRepository
        .registrarMovimiento(
          connection,

          productoId,

          usuarioId,

          'ENTRADA',

          cantidad,

          disponibleAnterior,

          disponibleNuevo,

          reservadoActual,

          reservadoActual,

          motivo
        );


      await connection.commit();


      return {

        producto_id:
          producto.id_producto,

        codigo:
          producto.codigo,

        nombre:
          producto.nombre,

        stock_disponible:
          disponibleNuevo,

        stock_reservado:
          reservadoActual,

        stock_fisico:
          this.redondear(
            disponibleNuevo +
            reservadoActual
          )
      };


    } catch (error) {

      await connection.rollback();

      throw error;


    } finally {

      connection.release();
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Ajuste por conteo físico
  |--------------------------------------------------------------------------
  */

  async registrarAjuste(
    usuarioId: number,
    datos: RegistrarAjusteDto
  ): Promise<ResultadoInventario> {

    this.validarId(
      usuarioId
    );


    if (!datos) {

      throw new Error(
        'DATOS_AJUSTE_OBLIGATORIOS'
      );
    }


    const productoId =
      Number(
        datos.producto_id
      );


    const nuevoStockFisico =
      Number(
        datos.nuevo_stock_fisico
      );


    this.validarId(
      productoId
    );


    if (
      !Number.isFinite(
        nuevoStockFisico
      ) ||

      nuevoStockFisico < 0
    ) {

      throw new Error(
        'STOCK_FISICO_INVALIDO'
      );
    }


    const motivo =
      this.validarMotivo(
        datos.motivo
      );


    const connection =
      await pool.getConnection();


    try {

      await connection
        .beginTransaction();


      const producto =
        await this.inventarioRepository
          .obtenerProductoConBloqueo(
            connection,
            productoId
          );


      if (!producto) {

        throw new Error(
          'PRODUCTO_NO_ENCONTRADO'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Validar unidades fraccionarias
      |--------------------------------------------------------------------------
      */

      this.validarCantidadProducto(
        producto,
        nuevoStockFisico,
        true
      );


      const disponibleAnterior =
        Number(
          producto.stock_disponible
        );


      const reservadoActual =
        Number(
          producto.stock_reservado
        );


      /*
       * El stock físico nunca puede
       * ser menor a lo reservado.
       */
      if (
        nuevoStockFisico <
        reservadoActual
      ) {

        throw new Error(
          'STOCK_FISICO_MENOR_QUE_RESERVADO'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | disponible = físico - reservado
      |--------------------------------------------------------------------------
      */

      const disponibleNuevo =
        this.redondear(
          nuevoStockFisico -
          reservadoActual
        );


      /*
      |--------------------------------------------------------------------------
      | Diferencia real del ajuste
      |--------------------------------------------------------------------------
      */

      const diferencia =
        this.redondear(
          disponibleNuevo -
          disponibleAnterior
        );


      if (
        diferencia === 0
      ) {

        throw new Error(
          'AJUSTE_SIN_CAMBIOS'
        );
      }


      await this.inventarioRepository
        .actualizarStockDisponible(
          connection,

          productoId,

          disponibleNuevo
        );


      /*
       * TB_MOVIMIENTO_STOCK.cantidad
       * debe ser positiva.
       *
       * Los campos anterior/nuevo
       * indican si aumentó o disminuyó.
       */
      await this.inventarioRepository
        .registrarMovimiento(
          connection,

          productoId,

          usuarioId,

          'AJUSTE',

          Math.abs(
            diferencia
          ),

          disponibleAnterior,

          disponibleNuevo,

          reservadoActual,

          reservadoActual,

          motivo
        );


      await connection.commit();


      return {

        producto_id:
          producto.id_producto,

        codigo:
          producto.codigo,

        nombre:
          producto.nombre,

        stock_disponible:
          disponibleNuevo,

        stock_reservado:
          reservadoActual,

        stock_fisico:
          nuevoStockFisico
      };


    } catch (error) {

      await connection.rollback();

      throw error;


    } finally {

      connection.release();
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Historial
  |--------------------------------------------------------------------------
  */

  async listarMovimientos(
    productoId?: number
  ): Promise<MovimientoStock[]> {

    if (
      productoId !== undefined
    ) {

      this.validarId(
        productoId
      );
    }


    return this.inventarioRepository
      .listarMovimientos(
        productoId
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Validaciones
  |--------------------------------------------------------------------------
  */

  private validarCantidad(
    cantidad: number
  ): void {

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {

      throw new Error(
        'CANTIDAD_INVALIDA'
      );
    }
  }


  private validarCantidadProducto(
    producto: ProductoStockRow,
    cantidad: number,
    permitirCero = false
  ): void {

    if (
      !Number.isFinite(cantidad) ||

      (
        permitirCero
          ? cantidad < 0
          : cantidad <= 0
      )
    ) {

      throw new Error(
        'CANTIDAD_INVALIDA'
      );
    }


    if (
      producto.unidad_medida !==
        'METRO' &&

      !Number.isInteger(
        cantidad
      )
    ) {

      throw new Error(
        'CANTIDAD_FRACCIONARIA_INVALIDA'
      );
    }
  }


  private validarMotivo(
    motivo: string
  ): string {

    const valor =
      motivo?.trim();


    if (!valor) {

      throw new Error(
        'MOTIVO_OBLIGATORIO'
      );
    }


    if (
      valor.length > 255
    ) {

      throw new Error(
        'MOTIVO_MUY_LARGO'
      );
    }


    return valor;
  }


  private redondear(
    valor: number
  ): number {

    return Number(
      valor.toFixed(2)
    );
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
}