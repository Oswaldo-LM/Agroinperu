import {
  randomBytes
} from 'node:crypto';

import {
  pool
} from '../config/database';

import {
  CrearProformaDto
} from '../models/proforma.model';

import {
  ProformaRepository
} from '../repositories/proforma.repository';


export class ProformaService {

  private readonly repository =
    new ProformaRepository();


  async listar() {

    await this.repository
      .actualizarVencidas();


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
        'ID_PROFORMA_INVALIDO'
      );
    }


    await this.repository
      .actualizarVencidas();


    const proforma =
      await this.repository
        .obtenerPorId(id);


    if (!proforma) {

      throw new Error(
        'PROFORMA_NO_ENCONTRADA'
      );
    }


    const detalles =
      await this.repository
        .listarDetalles(id);


    return {

      ...proforma,

      detalles
    };
  }


  async crear(
    usuarioId: number,
    datos: CrearProformaDto
  ) {

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {

      throw new Error(
        'USUARIO_INVALIDO'
      );
    }


    const clienteId =
      Number(
        datos.cliente_id
      );


    if (
      !Number.isInteger(clienteId) ||
      clienteId <= 0
    ) {

      throw new Error(
        'CLIENTE_INVALIDO'
      );
    }


    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        datos.fecha_vencimiento
      )
    ) {

      throw new Error(
        'FECHA_VENCIMIENTO_INVALIDA'
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
        'PROFORMA_SIN_PRODUCTOS'
      );
    }


    const connection =
      await pool
        .getConnection();


    try {

      await connection
        .beginTransaction();


      const cliente =
        await this.repository
          .obtenerClienteActivo(
            connection,
            clienteId
          );


      if (!cliente) {

        throw new Error(
          'CLIENTE_NO_ENCONTRADO'
        );
      }


      let subtotal =
        0;


      const detalles: {

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

      }[] = [];


      const productosUsados =
        new Set<number>();


      for (
        const item
        of datos.productos
      ) {

        const productoId =
          Number(
            item.producto_id
          );


        const cantidad =
          Number(
            item.cantidad
          );


        if (
          !Number.isInteger(
            productoId
          ) ||

          productoId <= 0
        ) {

          throw new Error(
            'PRODUCTO_INVALIDO'
          );
        }


        if (
          productosUsados.has(
            productoId
          )
        ) {

          throw new Error(
            'PRODUCTO_DUPLICADO'
          );
        }


        productosUsados.add(
          productoId
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


        const producto =
          await this.repository
            .obtenerProductoActivo(
              connection,
              productoId
            );


        if (!producto) {

          throw new Error(
            'PRODUCTO_NO_ENCONTRADO'
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


        const precio =
          Number(
            producto.precio
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


        detalles.push({

          producto_id:
            producto.id_producto,

          producto_nombre:
            producto.nombre,

          unidad_medida:
            producto.unidad_medida,

          precio_unitario:
            precio,

          cantidad,

          subtotal:
            subtotalDetalle
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


      const temporal =
        `TMP-${randomBytes(8)
          .toString('hex')}`;


      const proformaId =
        await this.repository
          .crearCabecera(
            connection,
            {

              numero_temporal:
                temporal,

              cliente_id:
                clienteId,

              usuario_id:
                usuarioId,

              subtotal,

              igv,

              total,

              fecha_vencimiento:
                datos.fecha_vencimiento,

              observacion:
                datos.observacion
                  ?.trim()
                || null
            }
          );


      const numero =
        String(
          proformaId
        )
          .padStart(
            8,
            '0'
          );


      await this.repository
        .actualizarNumero(
          connection,
          proformaId,
          numero
        );


      for (
        const detalle
        of detalles
      ) {

        await this.repository
          .crearDetalle(
            connection,
            {

              proforma_id:
                proformaId,

              ...detalle
            }
          );
      }


      await connection
        .commit();


      return this.obtenerPorId(
        proformaId
      );


    } catch (error) {

      await connection
        .rollback();


      throw error;

    } finally {

      connection.release();
    }
  }


  async anular(
    proformaId: number,
    usuarioId: number,
    motivo: string
  ) {

    if (
      !Number.isInteger(proformaId) ||
      proformaId <= 0
    ) {

      throw new Error(
        'ID_PROFORMA_INVALIDO'
      );
    }


    const motivoLimpio =
      motivo?.trim();


    if (!motivoLimpio) {

      throw new Error(
        'MOTIVO_ANULACION_REQUERIDO'
      );
    }


    const connection =
      await pool
        .getConnection();


    try {

      await connection
        .beginTransaction();


      const proforma =
        await this.repository
          .obtenerEstado(
            connection,
            proformaId
          );


      if (!proforma) {

        throw new Error(
          'PROFORMA_NO_ENCONTRADA'
        );
      }


      if (
        proforma.estado ===
        'ANULADA'
      ) {

        throw new Error(
          'PROFORMA_YA_ANULADA'
        );
      }


      await this.repository
        .anular(
          connection,
          proformaId,
          usuarioId,
          motivoLimpio
        );


      await connection
        .commit();


      return this.obtenerPorId(
        proformaId
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
}