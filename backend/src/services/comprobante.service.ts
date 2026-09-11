import {
  randomBytes
} from 'crypto';

import {
  pool
} from '../config/database';

import {
  Comprobante,
  EmitirComprobanteDto,
  TipoComprobante
} from '../models/comprobante.model';

import {
  ComprobanteRepository
} from '../repositories/comprobante.repository';


export class ComprobanteService {

  private comprobanteRepository =
    new ComprobanteRepository();


  async emitir(
    usuarioId: number,

    ventaId: number,

    datos: EmitirComprobanteDto
  ): Promise<Comprobante> {

    this.validarId(usuarioId);
    this.validarId(ventaId);


    if (!datos) {

      throw new Error(
        'DATOS_COMPROBANTE_OBLIGATORIOS'
      );
    }


    const tipo =
      datos.tipo_comprobante;


    this.validarTipo(
      tipo
    );


    const connection =
      await pool.getConnection();


    try {

      await connection
        .beginTransaction();


      /*
      |--------------------------------------------------------------------------
      | 1. Buscar venta
      |--------------------------------------------------------------------------
      */

      const venta =
        await this.comprobanteRepository
          .obtenerVentaConBloqueo(
            connection,
            ventaId
          );


      if (!venta) {

        throw new Error(
          'VENTA_NO_ENCONTRADA'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | 2. Validar estado
      |--------------------------------------------------------------------------
      */

      const estadosPermitidos = [
        'PAGADA',
        'EN_PREPARACION',
        'LISTA_PARA_RECOGER',
        'ENTREGADA'
      ];


      if (
        !estadosPermitidos.includes(
          venta.estado
        )
      ) {

        if (
          venta.estado ===
          'ANULADA'
        ) {

          throw new Error(
            'VENTA_ANULADA'
          );
        }


        throw new Error(
          'VENTA_NO_PAGADA'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | 3. Evitar comprobante duplicado
      |--------------------------------------------------------------------------
      */

      const existente =
        await this.comprobanteRepository
          .obtenerComprobanteEmitidoVenta(
            connection,
            ventaId
          );


      if (existente) {

        throw new Error(
          'COMPROBANTE_YA_EMITIDO'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | 4. Validar factura
      |--------------------------------------------------------------------------
      */

      if (
        tipo === 'FACTURA'
      ) {

        if (
          venta.tipo_documento !==
            'RUC' ||

          !venta.numero_documento ||

          !venta.razon_social
        ) {

          throw new Error(
            'FACTURA_REQUIERE_RUC'
          );
        }
      }


      /*
      |--------------------------------------------------------------------------
      | 5. Snapshot del cliente
      |--------------------------------------------------------------------------
      */

      const nombreCliente =
        venta.tipo_cliente ===
          'EMPRESA'

          ? venta.razon_social

          : [
              venta.nombres,
              venta.apellidos
            ]
              .filter(Boolean)
              .join(' ')
              || 'CLIENTE GENERAL';


      /*
      |--------------------------------------------------------------------------
      | 6. Serie
      |--------------------------------------------------------------------------
      */

      const serie =
        this.obtenerSerie(
          tipo
        );


      /*
      |--------------------------------------------------------------------------
      | 7. Número temporal
      |--------------------------------------------------------------------------
      */

      const numeroTemporal =
        `TMP-${randomBytes(6)
          .toString('hex')
          .toUpperCase()}`;


      /*
      |--------------------------------------------------------------------------
      | 8. Crear comprobante
      |--------------------------------------------------------------------------
      */

      const comprobanteId =
        await this.comprobanteRepository
          .crear(
            connection,

            ventaId,

            usuarioId,

            tipo,

            serie,

            numeroTemporal,

            venta.tipo_documento,

            venta.numero_documento,

            nombreCliente,

            venta.direccion,

            Number(
              venta.subtotal
            ),

            Number(
              venta.igv
            ),

            Number(
              venta.total
            )
          );


      /*
      |--------------------------------------------------------------------------
      | 9. Generar número definitivo
      |--------------------------------------------------------------------------
      */

      const numero =
        String(
          comprobanteId
        ).padStart(
          8,
          '0'
        );


      await this.comprobanteRepository
        .actualizarNumero(
          connection,

          comprobanteId,

          numero
        );


      await connection.commit();


      /*
      |--------------------------------------------------------------------------
      | 10. Recuperar comprobante
      |--------------------------------------------------------------------------
      */

      const comprobante =
        await this.comprobanteRepository
          .obtenerPorId(
            comprobanteId
          );


      if (!comprobante) {

        throw new Error(
          'ERROR_RECUPERAR_COMPROBANTE'
        );
      }


      return comprobante;


    } catch (error) {

      await connection.rollback();

      throw error;


    } finally {

      connection.release();
    }
  }


  async obtenerPorId(
    id: number
  ): Promise<Comprobante> {

    this.validarId(id);


    const comprobante =
      await this.comprobanteRepository
        .obtenerPorId(id);


    if (!comprobante) {

      throw new Error(
        'COMPROBANTE_NO_ENCONTRADO'
      );
    }


    return comprobante;
  }


  async obtenerPorVenta(
    ventaId: number
  ): Promise<Comprobante[]> {

    this.validarId(
      ventaId
    );


    return this.comprobanteRepository
      .obtenerPorVenta(
        ventaId
      );
  }


  private obtenerSerie(
    tipo: TipoComprobante
  ): string {

    switch (tipo) {

      case 'BOLETA':
        return 'B001';

      case 'FACTURA':
        return 'F001';

      case 'NOTA_VENTA':
        return 'NV001';

      default:
        throw new Error(
          'TIPO_COMPROBANTE_INVALIDO'
        );
    }
  }


  private validarTipo(
    tipo: TipoComprobante
  ): void {

    const permitidos:
      TipoComprobante[] = [

        'BOLETA',
        'FACTURA',
        'NOTA_VENTA'
      ];


    if (
      !permitidos.includes(
        tipo
      )
    ) {

      throw new Error(
        'TIPO_COMPROBANTE_INVALIDO'
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

async anular(
  usuarioId: number,

  comprobanteId: number,

  motivo: string
): Promise<Comprobante> {

  this.validarId(
    usuarioId
  );

  this.validarId(
    comprobanteId
  );


  const motivoLimpio =
    motivo?.trim();


  if (!motivoLimpio) {

    throw new Error(
      'MOTIVO_ANULACION_OBLIGATORIO'
    );
  }


  if (
    motivoLimpio.length > 255
  ) {

    throw new Error(
      'MOTIVO_ANULACION_MUY_LARGO'
    );
  }


  const connection =
    await pool.getConnection();


  try {

    await connection
      .beginTransaction();


    const comprobante =
      await this.comprobanteRepository
        .obtenerConBloqueo(
          connection,
          comprobanteId
        );


    if (!comprobante) {

      throw new Error(
        'COMPROBANTE_NO_ENCONTRADO'
      );
    }


    if (
      comprobante.estado ===
      'ANULADO'
    ) {

      throw new Error(
        'COMPROBANTE_YA_ANULADO'
      );
    }


    await this.comprobanteRepository
      .anular(
        connection,

        comprobanteId,

        usuarioId,

        motivoLimpio
      );


    await connection.commit();


    const resultado =
      await this.comprobanteRepository
        .obtenerPorId(
          comprobanteId
        );


    if (!resultado) {

      throw new Error(
        'ERROR_RECUPERAR_COMPROBANTE'
      );
    }


    return resultado;


  } catch (error) {

    await connection.rollback();

    throw error;


  } finally {

    connection.release();
  }
}
}