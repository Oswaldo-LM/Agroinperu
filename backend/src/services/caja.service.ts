import {
  pool
} from '../config/database';

import {
  AbrirCajaDto,
  CerrarCajaDto
} from '../models/caja.model';

import {
  CajaRepository
} from '../repositories/caja.repository';


export class CajaService {

  private readonly repository =
    new CajaRepository();


  async obtenerActual(
    usuarioId: number
  ) {

    this.validarUsuario(
      usuarioId
    );


    const caja =
      await this.repository
        .obtenerCajaAbierta(
          usuarioId
        );


    if (!caja) {

      return null;
    }


    const connection =
      await pool
        .getConnection();


    try {

      const resumen =
        await this.repository
          .calcularResumen(
            connection,
            usuarioId,
            caja.fecha_apertura
          );


      const montoApertura =
        Number(
          caja.monto_apertura
        );


      const totalEfectivo =
        Number(
          resumen.total_efectivo
        );


      return {

        ...caja,

        resumen: {

          cantidad_ventas:
            Number(
              resumen.cantidad_ventas
            ),

          total_ventas:
            this.redondear(
              Number(
                resumen.total_ventas
              )
            ),

          total_efectivo:
            this.redondear(
              totalEfectivo
            ),

          total_tarjeta:
            this.redondear(
              Number(
                resumen.total_tarjeta
              )
            ),

          total_yape:
            this.redondear(
              Number(
                resumen.total_yape
              )
            ),

          total_plin:
            this.redondear(
              Number(
                resumen.total_plin
              )
            ),

          total_transferencia:
            this.redondear(
              Number(
                resumen.total_transferencia
              )
            ),

          efectivo_esperado:
            this.redondear(
              montoApertura +
              totalEfectivo
            )
        }
      };


    } finally {

      connection.release();
    }
  }


  async abrir(
    usuarioId: number,
    datos: AbrirCajaDto
  ) {

    this.validarUsuario(
      usuarioId
    );


    const montoApertura =
      Number(
        datos.monto_apertura
      );


    if (
      !Number.isFinite(
        montoApertura
      ) ||

      montoApertura < 0
    ) {

      throw new Error(
        'MONTO_APERTURA_INVALIDO'
      );
    }


    const connection =
      await pool
        .getConnection();


    try {

      await connection
        .beginTransaction();


      const existente =
        await this.repository
          .obtenerCajaAbiertaConBloqueo(
            connection,
            usuarioId
          );


      if (existente) {

        throw new Error(
          'CAJA_YA_ABIERTA'
        );
      }


      const cajaId =
        await this.repository
          .crear(
            connection,
            usuarioId,
            this.redondear(
              montoApertura
            )
          );


      await connection
        .commit();


      return this.repository
        .obtenerPorId(
          cajaId
        );


    } catch (error) {

      await connection
        .rollback();


      throw error;

    } finally {

      connection.release();
    }
  }


  async cerrar(
    usuarioId: number,
    datos: CerrarCajaDto
  ) {

    this.validarUsuario(
      usuarioId
    );


    const efectivoDeclarado =
      Number(
        datos.efectivo_declarado
      );


    if (
      !Number.isFinite(
        efectivoDeclarado
      ) ||

      efectivoDeclarado < 0
    ) {

      throw new Error(
        'EFECTIVO_DECLARADO_INVALIDO'
      );
    }


    const observacion =
      datos.observacion
        ?.trim()
      || null;


    const connection =
      await pool
        .getConnection();


    try {

      await connection
        .beginTransaction();


      const caja =
        await this.repository
          .obtenerCajaAbiertaConBloqueo(
            connection,
            usuarioId
          );


      if (!caja) {

        throw new Error(
          'CAJA_NO_ABIERTA'
        );
      }


      const resumen =
        await this.repository
          .calcularResumen(
            connection,
            usuarioId,
            caja.fecha_apertura
          );


      const cantidadVentas =
        Number(
          resumen.cantidad_ventas
        );


      const totalVentas =
        this.redondear(
          Number(
            resumen.total_ventas
          )
        );


      const totalEfectivo =
        this.redondear(
          Number(
            resumen.total_efectivo
          )
        );


      const totalTarjeta =
        this.redondear(
          Number(
            resumen.total_tarjeta
          )
        );


      const totalYape =
        this.redondear(
          Number(
            resumen.total_yape
          )
        );


      const totalPlin =
        this.redondear(
          Number(
            resumen.total_plin
          )
        );


      const totalTransferencia =
        this.redondear(
          Number(
            resumen.total_transferencia
          )
        );


      const efectivoEsperado =
        this.redondear(
          Number(
            caja.monto_apertura
          ) +
          totalEfectivo
        );


      const diferencia =
        this.redondear(
          efectivoDeclarado -
          efectivoEsperado
        );


      await this.repository
        .cerrar(
          connection,
          caja.id_caja_sesion,
          {

            cantidad_ventas:
              cantidadVentas,

            total_ventas:
              totalVentas,

            total_efectivo:
              totalEfectivo,

            total_tarjeta:
              totalTarjeta,

            total_yape:
              totalYape,

            total_plin:
              totalPlin,

            total_transferencia:
              totalTransferencia,

            efectivo_esperado:
              efectivoEsperado,

            efectivo_declarado:
              this.redondear(
                efectivoDeclarado
              ),

            diferencia,

            observacion
          }
        );


      await connection
        .commit();


      return this.repository
        .obtenerPorId(
          caja.id_caja_sesion
        );


    } catch (error) {

      await connection
        .rollback();


      throw error;

    } finally {

      connection.release();
    }
  }


  async listarHistorial(
    usuarioId: number
  ) {

    this.validarUsuario(
      usuarioId
    );


    return this.repository
      .listarHistorialUsuario(
        usuarioId
      );
  }


  async listarHistorialGeneral() {

    return this.repository
      .listarHistorialGeneral();
  }


  async verificarCajaAbierta(
    usuarioId: number
  ): Promise<void> {

    const caja =
      await this.repository
        .obtenerCajaAbierta(
          usuarioId
        );


    if (!caja) {

      throw new Error(
        'CAJA_NO_ABIERTA'
      );
    }
  }


  private validarUsuario(
    usuarioId: number
  ): void {

    if (
      !Number.isInteger(
        usuarioId
      ) ||

      usuarioId <= 0
    ) {

      throw new Error(
        'USUARIO_INVALIDO'
      );
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