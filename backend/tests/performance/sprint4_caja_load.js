import http from 'k6/http';
import { check } from 'k6';

import {
  Trend,
  Rate
} from 'k6/metrics';


/*
|--------------------------------------------------------------------------
| MÉTRICAS
|--------------------------------------------------------------------------
*/

const consultaCajaDuration =
  new Trend(
    'consulta_caja_duration',
    true
  );

const cierreCajaDuration =
  new Trend(
    'cierre_caja_duration',
    true
  );

const consultaCajaFailed =
  new Rate(
    'consulta_caja_failed'
  );

const cierreCajaFailed =
  new Rate(
    'cierre_caja_failed'
  );


/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

export const options = {

  scenarios: {

    consultas_caja: {

      executor:
        'per-vu-iterations',

      vus:
        10,

      iterations:
        1,

      maxDuration:
        '30s'
    }
  },


  thresholds: {

    consulta_caja_duration: [
      'p(95)<500'
    ],

    cierre_caja_duration: [
      'p(95)<500'
    ],

    consulta_caja_failed: [
      'rate<0.01'
    ],

    cierre_caja_failed: [
      'rate<0.01'
    ],

    checks: [
      'rate>0.99'
    ]
  }
};


const BASE_URL =
  __ENV.API_URL ||
  'http://127.0.0.1:3001/api';


/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function obtenerData(
  response
) {

  try {

    const body =
      response.json();


    return (
      body?.data ??
      body
    );

  } catch {

    return null;
  }
}


/*
|--------------------------------------------------------------------------
| SETUP
|--------------------------------------------------------------------------
*/

export function setup() {

  /*
  |--------------------------------------------------------------------------
  | 1. LOGIN CAJERO
  |--------------------------------------------------------------------------
  */

  const login =
    http.post(

      `${BASE_URL}/auth/usuarios/login`,

      JSON.stringify({

        email:
          'cajero@agroinperu.com',

        password:
          'Cajero12345'
      }),

      {
        headers: {

          'Content-Type':
            'application/json'
        },

        tags: {

          endpoint:
            'login-cajero'
        }
      }
    );


  check(
    login,
    {

      'Login de cajero correcto':
        r =>
          r.status === 200
    }
  );


  if (
    login.status !== 200
  ) {

    console.error(
      `Login fallido: ${login.status} - ${login.body}`
    );

    throw new Error(
      'LOGIN_CAJERO_FALLIDO'
    );
  }


  const loginData =
    obtenerData(
      login
    );


  const token =
    loginData?.token;


  if (!token) {

    throw new Error(
      'TOKEN_CAJERO_NO_GENERADO'
    );
  }


  const authHeaders = {

    Authorization:
      `Bearer ${token}`,

    'Content-Type':
      'application/json'
  };


  /*
  |--------------------------------------------------------------------------
  | 2. VERIFICAR SI EXISTE UNA CAJA ABIERTA
  |--------------------------------------------------------------------------
  */

  const actual =
    http.get(

      `${BASE_URL}/caja/actual`,

      {
        headers:
          authHeaders,

        tags: {

          endpoint:
            'preparacion-caja'
        }
      }
    );


  const cajaActual =
    obtenerData(
      actual
    );


  /*
   * Si existe una caja anterior,
   * la cerramos para dejar limpia
   * la prueba.
   */
  if (
    actual.status === 200 &&
    cajaActual &&
    cajaActual.id_caja_sesion
  ) {

    const efectivoEsperado =
      Number(
        cajaActual
          ?.resumen
          ?.efectivo_esperado ??
        cajaActual
          ?.efectivo_esperado ??
        cajaActual
          ?.monto_apertura ??
        0
      );


    const cierreAnterior =
      http.post(

        `${BASE_URL}/caja/cerrar`,

        JSON.stringify({

          efectivo_declarado:
            efectivoEsperado,

          observacion:
            'Cierre previo a prueba de rendimiento'
        }),

        {
          headers:
            authHeaders,

          tags: {

            endpoint:
              'preparacion-caja'
          }
        }
      );


    if (
      cierreAnterior.status !== 200 &&
      cierreAnterior.status !== 201
    ) {

      console.error(
        `No se pudo cerrar la caja anterior: ${cierreAnterior.status} - ${cierreAnterior.body}`
      );

      throw new Error(
        'NO_SE_PUDO_LIMPIAR_CAJA_ANTERIOR'
      );
    }


    console.log(
      'Caja anterior cerrada correctamente.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 3. ABRIR CAJA PARA LA PRUEBA
  |--------------------------------------------------------------------------
  */

  const apertura =
    http.post(

      `${BASE_URL}/caja/abrir`,

      JSON.stringify({

        monto_apertura:
          100
      }),

      {
        headers:
          authHeaders,

        tags: {

          endpoint:
            'apertura-prueba'
        }
      }
    );


  const aperturaCorrecta =

    apertura.status === 200 ||

    apertura.status === 201;


  check(
    apertura,
    {

      'Caja preparada para prueba':
        () =>
          aperturaCorrecta
    }
  );


  if (
    !aperturaCorrecta
  ) {

    console.error(
      `Error abriendo caja: ${apertura.status} - ${apertura.body}`
    );

    throw new Error(
      'APERTURA_CAJA_FALLIDA'
    );
  }


  console.log(
    'Caja abierta con S/ 100.00.'
  );


  console.log(
    'Iniciando 10 consultas concurrentes...'
  );


  return {

    token
  };
}


/*
|--------------------------------------------------------------------------
| CONSULTA CONCURRENTE
|--------------------------------------------------------------------------
*/

export default function (
  data
) {

  const response =
    http.get(

      `${BASE_URL}/caja/actual`,

      {
        headers: {

          Authorization:
            `Bearer ${data.token}`,

          Accept:
            'application/json'
        },

        tags: {

          endpoint:
            'consulta-caja'
        }
      }
    );


  consultaCajaDuration.add(
    response.timings.duration
  );


  const consultaCorrecta =
    response.status === 200;


  consultaCajaFailed.add(
    !consultaCorrecta
  );


  const caja =
    obtenerData(
      response
    );


  check(
    response,
    {

      'Consulta de caja responde 200':
        () =>
          consultaCorrecta,


      'Caja actual disponible':
        () =>
          Boolean(
            caja?.id_caja_sesion
          ),


      'Caja permanece ABIERTA':
        () =>
          caja?.estado ===
          'ABIERTA',


      'Efectivo esperado disponible':
        () =>
          Number.isFinite(
            Number(
              caja
                ?.resumen
                ?.efectivo_esperado
            )
          )
    }
  );


  if (
    !consultaCorrecta
  ) {

    console.error(
      `VU ${__VU} - Error consulta: ${response.status} - ${response.body}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| CIERRE FINAL
|--------------------------------------------------------------------------
*/

export function teardown(
  data
) {

  console.log(
    'Consultas terminadas. Ejecutando cierre de caja...'
  );


  /*
  |--------------------------------------------------------------------------
  | OBTENER EFECTIVO ESPERADO
  |--------------------------------------------------------------------------
  */

  const actual =
    http.get(

      `${BASE_URL}/caja/actual`,

      {
        headers: {

          Authorization:
            `Bearer ${data.token}`,

          Accept:
            'application/json'
        },

        tags: {

          endpoint:
            'pre-cierre'
        }
      }
    );


  const caja =
    obtenerData(
      actual
    );


  const efectivoEsperado =
    Number(
      caja
        ?.resumen
        ?.efectivo_esperado ??
      100
    );


  /*
  |--------------------------------------------------------------------------
  | CERRAR CAJA
  |--------------------------------------------------------------------------
  */

  const cierre =
    http.post(

      `${BASE_URL}/caja/cerrar`,

      JSON.stringify({

        efectivo_declarado:
          efectivoEsperado,

        observacion:
          'Prueba rendimiento Sprint 4'
      }),

      {
        headers: {

          Authorization:
            `Bearer ${data.token}`,

          'Content-Type':
            'application/json'
        },

        tags: {

          endpoint:
            'cierre-caja'
        }
      }
    );


  cierreCajaDuration.add(
    cierre.timings.duration
  );


  const cierreCorrecto =

    cierre.status === 200 ||

    cierre.status === 201;


  cierreCajaFailed.add(
    !cierreCorrecto
  );


  const resultado =
    obtenerData(
      cierre
    );


  check(
    cierre,
    {

      'Cierre de caja responde 200/201':
        () =>
          cierreCorrecto,


      'Caja queda CERRADA':
        () =>
          resultado?.estado ===
          'CERRADA',


      'Diferencia de caja es 0':
        () =>
          Number(
            resultado?.diferencia
          ) === 0
    }
  );


  console.log(
    `Cierre de caja HTTP ${cierre.status}`
  );


  console.log(
    `Tiempo de cierre: ${cierre.timings.duration.toFixed(2)} ms`
  );


  if (
    !cierreCorrecto
  ) {

    console.error(
      `Error en cierre: ${cierre.status} - ${cierre.body}`
    );
  }
}