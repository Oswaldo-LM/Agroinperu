import {
  After,
  Before,
  Given,
  When,
  Then
} from '@cucumber/cucumber';

import assert from 'node:assert/strict';

import {
  CajaService
} from '../../../src/services/caja.service';

import {
  pool
} from '../../../src/config/database';


let service:
  CajaService;

let usuarioId =
  3;

let cajaAbierta:
  any = null;

let resultado:
  any = null;

let errorCapturado:
  Error | null = null;

let totalEfectivo =
  0;

let cajaGuardada:
  any = null;


/*
|--------------------------------------------------------------------------
| CONEXIÓN FALSA
|--------------------------------------------------------------------------
*/

const connectionMock = {

  beginTransaction:
    async () => {},

  commit:
    async () => {},

  rollback:
    async () => {},

  release:
    () => {}
};


let getConnectionOriginal:
  typeof pool.getConnection;


/*
|--------------------------------------------------------------------------
| REPOSITORIO FALSO
|--------------------------------------------------------------------------
*/

const repositoryMock = {

  async obtenerCajaAbierta(
    id: number
  ) {

    if (
      cajaAbierta &&
      cajaAbierta.usuario_id === id &&
      cajaAbierta.estado === 'ABIERTA'
    ) {

      return cajaAbierta;
    }


    return null;
  },


  async obtenerCajaAbiertaConBloqueo(
    _connection: any,
    id: number
  ) {

    if (
      cajaAbierta &&
      cajaAbierta.usuario_id === id &&
      cajaAbierta.estado === 'ABIERTA'
    ) {

      return cajaAbierta;
    }


    return null;
  },


  async crear(
    _connection: any,
    id: number,
    montoApertura: number
  ) {

    cajaAbierta = {

      id_caja_sesion:
        1,

      usuario_id:
        id,

      monto_apertura:
        montoApertura,

      fecha_apertura:
        new Date(),

      estado:
        'ABIERTA'
    };


    cajaGuardada =
      cajaAbierta;


    return 1;
  },


  async obtenerPorId(
    id: number
  ) {

    if (
      cajaGuardada &&
      cajaGuardada.id_caja_sesion === id
    ) {

      return cajaGuardada;
    }


    return null;
  },


  async calcularResumen(
    _connection: any,
    _usuarioId: number,
    _fechaApertura: Date
  ) {

    return {

      cantidad_ventas:
        totalEfectivo > 0
          ? 1
          : 0,

      total_ventas:
        totalEfectivo,

      total_efectivo:
        totalEfectivo,

      total_tarjeta:
        0,

      total_yape:
        0,

      total_plin:
        0,

      total_transferencia:
        0
    };
  },


  async cerrar(
    _connection: any,
    cajaId: number,
    datos: any
  ) {

    cajaGuardada = {

      ...cajaAbierta,

      ...datos,

      id_caja_sesion:
        cajaId,

      estado:
        'CERRADA',

      fecha_cierre:
        new Date()
    };


    cajaAbierta =
      null;
  },


  async listarHistorialUsuario(
    _usuarioId: number
  ) {

    return [];
  },


  async listarHistorialGeneral() {

    return [];
  }
};


/*
|--------------------------------------------------------------------------
| PREPARACIÓN
|--------------------------------------------------------------------------
*/

Before(
  { tags: '@sprint4' },
  function () {

    usuarioId =
      3;

    cajaAbierta =
      null;

    resultado =
      null;

    errorCapturado =
      null;

    totalEfectivo =
      0;

    cajaGuardada =
      null;


    service =
      new CajaService();


    /*
     * Sustituimos el repositorio real
     * únicamente durante la prueba.
     */
    (
      service as any
    ).repository =
      repositoryMock;


    /*
     * Evitamos utilizar MySQL real.
     */
    getConnectionOriginal =
      pool.getConnection
        .bind(pool);


    (
      pool as any
    ).getConnection =
      async () =>
        connectionMock;
  }
);


After(
  { tags: '@sprint4' },
  function () {

    (
      pool as any
    ).getConnection =
      getConnectionOriginal;
  }
);


/*
|--------------------------------------------------------------------------
| GIVEN
|--------------------------------------------------------------------------
*/

Given(
  'que el usuario de caja tiene el identificador {int}',
  function (
    id: number
  ) {

    usuarioId =
      id;
  }
);


Given(
  'no existe una caja abierta para el usuario',
  function () {

    cajaAbierta =
      null;
  }
);


Given(
  'ya existe una caja abierta para el usuario',
  function () {

    cajaAbierta = {

      id_caja_sesion:
        1,

      usuario_id:
        usuarioId,

      monto_apertura:
        100,

      fecha_apertura:
        new Date(),

      estado:
        'ABIERTA'
    };


    cajaGuardada =
      cajaAbierta;
  }
);


Given(
  'existe una caja abierta con monto de apertura de {int}',
  function (
    monto: number
  ) {

    cajaAbierta = {

      id_caja_sesion:
        1,

      usuario_id:
        usuarioId,

      monto_apertura:
        monto,

      fecha_apertura:
        new Date(),

      estado:
        'ABIERTA'
    };


    cajaGuardada =
      cajaAbierta;
  }
);


Given(
  'durante el turno se registraron {int} soles en efectivo',
  function (
    monto: number
  ) {

    totalEfectivo =
      monto;
  }
);


/*
|--------------------------------------------------------------------------
| WHEN
|--------------------------------------------------------------------------
*/

When(
  'el usuario abre la caja con un monto de {int}',
  async function (
    monto: number
  ) {

    try {

      resultado =
        await service.abrir(
          usuarioId,
          {
            monto_apertura:
              monto
          }
        );

    } catch (error) {

      errorCapturado =
        error as Error;
    }
  }
);


When(
  'el usuario intenta abrir otra caja con un monto de {int}',
  async function (
    monto: number
  ) {

    try {

      resultado =
        await service.abrir(
          usuarioId,
          {
            monto_apertura:
              monto
          }
        );

    } catch (error) {

      errorCapturado =
        error as Error;
    }
  }
);


When(
  'el usuario consulta su caja actual',
  async function () {

    resultado =
      await service
        .obtenerActual(
          usuarioId
        );
  }
);


When(
  'el usuario cierra la caja declarando {int} soles',
  async function (
    efectivo: number
  ) {

    try {

      resultado =
        await service.cerrar(
          usuarioId,
          {
            efectivo_declarado:
              efectivo,

            observacion:
              'Cierre funcional Sprint 4'
          }
        );

    } catch (error) {

      errorCapturado =
        error as Error;
    }
  }
);


/*
|--------------------------------------------------------------------------
| THEN
|--------------------------------------------------------------------------
*/

Then(
  'la apertura de caja es registrada correctamente',
  function () {

    assert.ok(
      resultado
    );

    assert.equal(
      resultado.usuario_id,
      usuarioId
    );

    assert.equal(
      Number(
        resultado.monto_apertura
      ),
      100
    );
  }
);


Then(
  'la caja queda en estado {string}',
  function (
    estadoEsperado: string
  ) {

    assert.ok(
      resultado
    );

    assert.equal(
      resultado.estado,
      estadoEsperado
    );
  }
);


Then(
  'la operación de caja es rechazada con el error {string}',
  function (
    errorEsperado: string
  ) {

    assert.ok(
      errorCapturado
    );

    assert.equal(
      errorCapturado.message,
      errorEsperado
    );
  }
);


Then(
  'el efectivo esperado de la caja es {int}',
  function (
    esperado: number
  ) {

    assert.ok(
      resultado
    );

    assert.equal(
      resultado.resumen
        .efectivo_esperado,
      esperado
    );
  }
);


Then(
  'el efectivo esperado al cierre es {int}',
  function (
    esperado: number
  ) {

    assert.ok(
      resultado
    );

    assert.equal(
      resultado.efectivo_esperado,
      esperado
    );
  }
);


Then(
  'la diferencia de caja es {int}',
  function (
    diferenciaEsperada: number
  ) {

    assert.ok(
      resultado
    );

    assert.equal(
      resultado.diferencia,
      diferenciaEsperada
    );
  }
);