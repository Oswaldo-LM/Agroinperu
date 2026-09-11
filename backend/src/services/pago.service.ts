import {
  pool
} from '../config/database';

import {
  MetodoPago,
  Pago,
  RegistrarPagoWebDto
} from '../models/pago.model';

import {
  PagoRepository
} from '../repositories/pago.repository';


export class PagoService {

  private pagoRepository =
    new PagoRepository();


  /*
  |--------------------------------------------------------------------------
  | Cliente registra pago WEB
  |--------------------------------------------------------------------------
  */

  async registrarPagoWeb(
    clienteId: number,
    datos: RegistrarPagoWebDto
  ): Promise<Pago> {

    this.validarId(clienteId);

    if (!datos) {
      throw new Error(
        'DATOS_PAGO_OBLIGATORIOS'
      );
    }


    const ventaId =
      Number(datos.venta_id);

    this.validarId(ventaId);


    this.validarMetodoPagoWeb(
      datos.metodo_pago
    );


    const referencia =
      datos.referencia_transaccion
        ?.trim();


    if (!referencia) {

      throw new Error(
        'REFERENCIA_OBLIGATORIA'
      );
    }


    if (
      referencia.length > 100
    ) {

      throw new Error(
        'REFERENCIA_MUY_LARGA'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Verificar que la venta pertenece al cliente
    |--------------------------------------------------------------------------
    */

    const venta =
      await this.pagoRepository
        .obtenerVentaCliente(
          ventaId,
          clienteId
        );


    if (!venta) {

      throw new Error(
        'VENTA_NO_ENCONTRADA'
      );
    }


    if (
      venta.estado !==
      'PENDIENTE_PAGO'
    ) {

      throw new Error(
        'VENTA_NO_PENDIENTE_PAGO'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Evitar dos pagos pendientes simultáneos
    |--------------------------------------------------------------------------
    */

    const pagoPendiente =
      await this.pagoRepository
        .obtenerPagoPendienteVenta(
          ventaId
        );


    if (pagoPendiente) {

      throw new Error(
        'PAGO_PENDIENTE_EXISTENTE'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | El monto se obtiene DE LA BASE
    |--------------------------------------------------------------------------
    */

    const monto =
      Number(venta.total);


    const pagoId =
      await this.pagoRepository
        .crearPagoWeb(
          ventaId,
          datos.metodo_pago,
          monto,
          referencia
        );


    const pago =
      await this.pagoRepository
        .obtenerPorId(
          pagoId
        );


    if (!pago) {

      throw new Error(
        'ERROR_RECUPERAR_PAGO'
      );
    }


    return pago;
  }


  /*
  |--------------------------------------------------------------------------
  | Consultar pagos de una venta del cliente
  |--------------------------------------------------------------------------
  */

  async listarPagosCliente(
    clienteId: number,
    ventaId: number
  ): Promise<Pago[]> {

    this.validarId(clienteId);
    this.validarId(ventaId);


    const venta =
      await this.pagoRepository
        .obtenerVentaCliente(
          ventaId,
          clienteId
        );


    if (!venta) {

      throw new Error(
        'VENTA_NO_ENCONTRADA'
      );
    }


    return this.pagoRepository
      .obtenerPagosVenta(
        ventaId
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Aprobar pago
  |--------------------------------------------------------------------------
  */

  async aprobarPago(
    usuarioId: number,
    pagoId: number
  ): Promise<void> {

    this.validarId(usuarioId);
    this.validarId(pagoId);


    const connection =
      await pool.getConnection();


    try {

      await connection
        .beginTransaction();


      const pago =
        await this.pagoRepository
          .obtenerPagoConBloqueo(
            connection,
            pagoId
          );


      if (!pago) {

        throw new Error(
          'PAGO_NO_ENCONTRADO'
        );
      }


      if (
        pago.estado_pago !==
        'PENDIENTE'
      ) {

        throw new Error(
          'PAGO_NO_PENDIENTE'
        );
      }


      const venta =
        await this.pagoRepository
          .obtenerVentaConBloqueo(
            connection,
            pago.venta_id
          );


      if (!venta) {

        throw new Error(
          'VENTA_NO_ENCONTRADA'
        );
      }


      if (
        venta.estado !==
        'PENDIENTE_PAGO'
      ) {

        throw new Error(
          'VENTA_NO_PENDIENTE_PAGO'
        );
      }


      /*
       * Verificación adicional:
       * el monto registrado debe coincidir
       * con el total de la venta.
       */
      if (
        Number(pago.monto) !==
        Number(venta.total)
      ) {

        throw new Error(
          'MONTO_PAGO_INVALIDO'
        );
      }


      await this.pagoRepository
        .aprobarPago(
          connection,
          pagoId
        );


      await this.pagoRepository
        .marcarVentaPagada(
          connection,
          venta.id_venta
        );


      await this.pagoRepository
        .registrarHistorialPago(
          connection,
          venta.id_venta,
          usuarioId
        );


      await connection.commit();


    } catch (error) {

      await connection.rollback();

      throw error;


    } finally {

      connection.release();
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Rechazar pago
  |--------------------------------------------------------------------------
  */

  async rechazarPago(
    usuarioId: number,
    pagoId: number
  ): Promise<void> {

    this.validarId(usuarioId);
    this.validarId(pagoId);


    const connection =
      await pool.getConnection();


    try {

      await connection
        .beginTransaction();


      const pago =
        await this.pagoRepository
          .obtenerPagoConBloqueo(
            connection,
            pagoId
          );


      if (!pago) {

        throw new Error(
          'PAGO_NO_ENCONTRADO'
        );
      }


      if (
        pago.estado_pago !==
        'PENDIENTE'
      ) {

        throw new Error(
          'PAGO_NO_PENDIENTE'
        );
      }


      /*
       * Rechazar el pago NO anula la venta.
       * El cliente puede registrar otro intento.
       */
      await this.pagoRepository
        .rechazarPago(
          connection,
          pagoId
        );


      await connection.commit();


    } catch (error) {

      await connection.rollback();

      throw error;


    } finally {

      connection.release();
    }
  }


  private validarMetodoPagoWeb(
    metodo: MetodoPago
  ): void {

    const permitidos:
      MetodoPago[] = [
        'YAPE',
        'PLIN',
        'TRANSFERENCIA'
      ];


    if (
      !permitidos.includes(
        metodo
      )
    ) {

      throw new Error(
        'METODO_PAGO_INVALIDO'
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

  async listarPagosVentaInterno(
  ventaId: number
): Promise<Pago[]> {

  if (
    !Number.isInteger(ventaId) ||
    ventaId <= 0
  ) {

    throw new Error(
      'ID_VENTA_INVALIDO'
    );
  }


  return this.pagoRepository
    .obtenerPagosVenta(
      ventaId
    );
}


}

