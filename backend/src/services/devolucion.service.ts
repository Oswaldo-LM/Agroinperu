import {
  randomBytes
} from 'node:crypto';

import {
  pool
} from '../config/database';

import {
  CrearDevolucionDto
} from '../models/devolucion.model';

import {
  DevolucionRepository
} from '../repositories/devolucion.repository';


export class DevolucionService {

  private readonly repository =
    new DevolucionRepository();


  async listar() {

    return this.repository
      .listar();
  }


  async obtenerPorId(
    id: number
  ) {

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      throw new Error(
        'ID_DEVOLUCION_INVALIDO'
      );
    }


    const devolucion =
      await this.repository
        .obtenerPorId(id);


    if (!devolucion) {

      throw new Error(
        'DEVOLUCION_NO_ENCONTRADA'
      );
    }


    const detalles =
      await this.repository
        .listarDetalles(id);


    return {

      ...devolucion,

      detalles
    };
  }


  async obtenerProductosDevolvibles(
    ventaId: number
  ) {

    if (
      !Number.isInteger(ventaId) ||
      ventaId <= 0
    ) {

      throw new Error(
        'ID_VENTA_INVALIDO'
      );
    }


    return this.repository
      .listarDetallesDisponiblesVenta(
        ventaId
      );
  }


  async crear(
    usuarioId: number,
    datos: CrearDevolucionDto
  ) {

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {

      throw new Error(
        'USUARIO_INVALIDO'
      );
    }


    const ventaId =
      Number(
        datos.venta_id
      );


    if (
      !Number.isInteger(ventaId) ||
      ventaId <= 0
    ) {

      throw new Error(
        'ID_VENTA_INVALIDO'
      );
    }


    const motivo =
      datos.motivo
        ?.trim();


    if (!motivo) {

      throw new Error(
        'MOTIVO_REQUERIDO'
      );
    }


    if (
      !Array.isArray(
        datos.productos
      ) ||

      datos.productos.length ===
      0
    ) {

      throw new Error(
        'DEVOLUCION_SIN_PRODUCTOS'
      );
    }


    const connection =
      await pool
        .getConnection();


    try {

      await connection
        .beginTransaction();


      /*
      |--------------------------------------------------------------------------
      | Bloqueamos la venta.
      |
      | Esto también serializa dos devoluciones
      | concurrentes de la misma venta.
      |--------------------------------------------------------------------------
      */

      const venta =
        await this.repository
          .obtenerVentaConBloqueo(
            connection,
            ventaId
          );


      if (!venta) {

        throw new Error(
          'VENTA_NO_ENCONTRADA'
        );
      }


      if (
        venta.estado !==
        'ENTREGADA'
      ) {

        throw new Error(
          'VENTA_NO_ENTREGADA'
        );
      }


      const detallesUsados =
        new Set<number>();


      const detalles: {

        detalle_venta_id: number;

        producto_id: number;

        producto_nombre: string;

        unidad_medida:
          'UNIDAD'
          | 'METRO'
          | 'ROLLO'
          | 'CAJA';

        precio_unitario: number;

        cantidad: number;

        subtotal: number;

        disponible_anterior: number;

        disponible_nuevo: number;

        reservado_anterior: number;

        reservado_nuevo: number;

      }[] = [];


      let subtotal =
        0;


      for (
        const item
        of datos.productos
      ) {

        const detalleVentaId =
          Number(
            item.detalle_venta_id
          );


        const cantidad =
          Number(
            item.cantidad
          );


        if (
          !Number.isInteger(
            detalleVentaId
          ) ||

          detalleVentaId <= 0
        ) {

          throw new Error(
            'DETALLE_VENTA_INVALIDO'
          );
        }


        if (
          detallesUsados.has(
            detalleVentaId
          )
        ) {

          throw new Error(
            'DETALLE_DUPLICADO'
          );
        }


        detallesUsados.add(
          detalleVentaId
        );


        if (
          !Number.isFinite(
            cantidad
          ) ||

          cantidad <= 0
        ) {

          throw new Error(
            'CANTIDAD_INVALIDA'
          );
        }


        const detalle =
          await this.repository
            .obtenerDetalleConDevuelto(
              connection,
              ventaId,
              detalleVentaId
            );


        if (!detalle) {

          throw new Error(
            'DETALLE_VENTA_NO_ENCONTRADO'
          );
        }


        if (
          detalle.unidad_medida !==
            'METRO' &&

          !Number.isInteger(
            cantidad
          )
        ) {

          throw new Error(
            'CANTIDAD_FRACCIONARIA_INVALIDA'
          );
        }


        const cantidadVendida =
          Number(
            detalle.cantidad
          );


        const cantidadDevuelta =
          Number(
            detalle.cantidad_devuelta
          );


        const disponibleDevolver =
          this.redondear(
            cantidadVendida -
            cantidadDevuelta
          );


        if (
          cantidad >
          disponibleDevolver
        ) {

          throw new Error(
            'CANTIDAD_DEVOLUCION_EXCEDIDA'
          );
        }


        const producto =
          await this.repository
            .obtenerProductoConBloqueo(
              connection,
              detalle.producto_id
            );


        if (!producto) {

          throw new Error(
            'PRODUCTO_NO_ENCONTRADO'
          );
        }


        const precio =
          Number(
            detalle.precio_unitario
          );


        const subtotalDetalle =
          this.redondear(
            precio *
            cantidad
          );


        subtotal =
          this.redondear(
            subtotal +
            subtotalDetalle
          );


        const disponibleAnterior =
          Number(
            producto.stock_disponible
          );


        const reservadoAnterior =
          Number(
            producto.stock_reservado
          );


        const disponibleNuevo =
          this.redondear(
            disponibleAnterior +
            cantidad
          );


        /*
         * Una venta ENTREGADA ya consumió
         * su reserva. La devolución física
         * vuelve a stock disponible.
         *
         * stock_reservado NO cambia.
         */

        detalles.push({

          detalle_venta_id:
            detalle.id_detalle_venta,

          producto_id:
            detalle.producto_id,

          producto_nombre:
            detalle.producto_nombre,

          unidad_medida:
            detalle.unidad_medida,

          precio_unitario:
            precio,

          cantidad,

          subtotal:
            subtotalDetalle,

          disponible_anterior:
            disponibleAnterior,

          disponible_nuevo:
            disponibleNuevo,

          reservado_anterior:
            reservadoAnterior,

          reservado_nuevo:
            reservadoAnterior
        });
      }


      const igv =
        this.redondear(
          subtotal *
          0.18
        );


      const total =
        this.redondear(
          subtotal +
          igv
        );


      const codigoTemporal =
        `TMP-${randomBytes(8)
          .toString('hex')}`;


      const devolucionId =
        await this.repository
          .crearCabecera(
            connection,
            {

              codigo_temporal:
                codigoTemporal,

              venta_id:
                ventaId,

              usuario_id:
                usuarioId,

              motivo,

              subtotal,

              igv,

              total
            }
          );


      const codigo =
        `DEV-${String(
          devolucionId
        ).padStart(
          8,
          '0'
        )}`;


      await this.repository
        .actualizarCodigo(
          connection,
          devolucionId,
          codigo
        );


      /*
      |--------------------------------------------------------------------------
      | Detalles + inventario
      |--------------------------------------------------------------------------
      */

      for (
        const detalle
        of detalles
      ) {

        await this.repository
          .crearDetalle(
            connection,
            {

              devolucion_id:
                devolucionId,

              detalle_venta_id:
                detalle.detalle_venta_id,

              producto_id:
                detalle.producto_id,

              producto_nombre:
                detalle.producto_nombre,

              unidad_medida:
                detalle.unidad_medida,

              precio_unitario:
                detalle.precio_unitario,

              cantidad:
                detalle.cantidad,

              subtotal:
                detalle.subtotal
            }
          );


        await this.repository
          .actualizarStockDisponible(
            connection,
            detalle.producto_id,
            detalle.disponible_nuevo
          );


        await this.repository
          .registrarMovimientoStock(
            connection,
            {

              producto_id:
                detalle.producto_id,

              venta_id:
                ventaId,

              usuario_id:
                usuarioId,

              cantidad:
                detalle.cantidad,

              disponible_anterior:
                detalle.disponible_anterior,

              disponible_nuevo:
                detalle.disponible_nuevo,

              reservado_anterior:
                detalle.reservado_anterior,

              reservado_nuevo:
                detalle.reservado_nuevo,

              motivo:
                `Devolución ${codigo}: ${motivo}`
            }
          );
      }


      await connection
        .commit();


      return this.obtenerPorId(
        devolucionId
      );


    } catch (error) {

      await connection
        .rollback();


      throw error;

    } finally {

      connection.release();
    }
  }


  private redondear(
    valor: number
  ): number {

    return Number(
      valor.toFixed(2)
    );
  }

  async listarVentasEntregadas(
  buscar = ''
) {

  return this.repository
    .listarVentasEntregadas(
      buscar
    );
}
}