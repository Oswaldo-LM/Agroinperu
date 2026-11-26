import http from 'k6/http';
import { check } from 'k6';

import {
  Trend,
  Rate
} from 'k6/metrics';


/*
|--------------------------------------------------------------------------
| MÉTRICAS EXCLUSIVAS DEL PEDIDO WEB
|--------------------------------------------------------------------------
*/

const pedidoDuration =
  new Trend(
    'pedido_web_duration',
    true
  );

const pedidoFailed =
  new Rate(
    'pedido_web_failed'
  );


/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

export const options = {

  scenarios: {

    pedidos_simultaneos: {

      executor: 'per-vu-iterations',

      vus: 10,

      iterations: 1,

      maxDuration: '30s',
    },
  },


  thresholds: {

    pedido_web_duration: [
      'p(95)<500'
    ],

    pedido_web_failed: [
      'rate<0.01'
    ],

    checks: [
      'rate>0.99'
    ],
  },
};


const BASE_URL =
  __ENV.API_URL ||
  'http://127.0.0.1:3001/api';


/*
|--------------------------------------------------------------------------
| CLIENTES DE RENDIMIENTO
|--------------------------------------------------------------------------
*/

const clientes = [

  {
    email:
      'rendimiento01@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento02@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento03@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento04@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento05@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento06@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento07@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento08@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento09@agroinperu.com',

    password:
      'Rendimiento12345'
  },

  {
    email:
      'rendimiento10@agroinperu.com',

    password:
      'Rendimiento12345'
  }
];


/*
|--------------------------------------------------------------------------
| SETUP
|--------------------------------------------------------------------------
|
| Los clientes inician sesión ANTES de comenzar la prueba concurrente.
|
| De esta manera:
|
| Login
|      ↓
| Obtener JWT
|      ↓
| Comienza escenario
|      ↓
| 10 pedidos simultáneos
|
|--------------------------------------------------------------------------
*/

export function setup() {

  const tokens = [];


  for (
    let i = 0;
    i < clientes.length;
    i++
  ) {

    const cliente =
      clientes[i];


    const payload =
      JSON.stringify({

        email:
          cliente.email,

        password:
          cliente.password
      });


    const response =
      http.post(

        `${BASE_URL}/auth/clientes/login`,

        payload,

        {
          headers: {

            'Content-Type':
              'application/json'
          },

          tags: {

            endpoint:
              'login-preparacion'
          }
        }
      );


    const loginCorrecto =
      response.status === 200;


    if (
      !loginCorrecto
    ) {

      console.error(
        `Login fallido para ${cliente.email}: HTTP ${response.status} - ${response.body}`
      );

      throw new Error(
        `LOGIN_FALLIDO:${cliente.email}`
      );
    }


    let body;


    try {

      body =
        response.json();

    } catch {

      throw new Error(
        `RESPUESTA_LOGIN_INVALIDA:${cliente.email}`
      );
    }


    const token =

      body?.data?.token ||

      body?.token;


    if (!token) {

      throw new Error(
        `TOKEN_NO_GENERADO:${cliente.email}`
      );
    }


    tokens.push(
      token
    );


    console.log(
      `Login preparado: ${cliente.email}`
    );
  }


  console.log(
    '10 clientes autenticados. Iniciando pedidos concurrentes...'
  );


  return {
    tokens
  };
}


/*
|--------------------------------------------------------------------------
| PRUEBA CONCURRENTE
|--------------------------------------------------------------------------
*/

export default function (
  data
) {

  /*
   * Cada VU recibe un JWT diferente.
   *
   * VU 1  -> cliente 01
   * VU 2  -> cliente 02
   * ...
   * VU 10 -> cliente 10
   */

  const indice =
    __VU - 1;


  const token =
    data.tokens[indice];


  if (!token) {

    throw new Error(
      `TOKEN_NO_DISPONIBLE_VU:${__VU}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR VENTA WEB
  |--------------------------------------------------------------------------
  */

  const response =
    http.post(

      `${BASE_URL}/ventas/web/confirmar`,

      null,

      {
        headers: {

          Authorization:
            `Bearer ${token}`,

          Accept:
            'application/json'
        },

        tags: {

          endpoint:
            'confirmar-pedido-web'
        }
      }
    );


  /*
  |--------------------------------------------------------------------------
  | REGISTRAR RENDIMIENTO
  |--------------------------------------------------------------------------
  */

  pedidoDuration.add(
    response.timings.duration
  );


  const httpCorrecto =

    response.status === 200 ||

    response.status === 201;


  pedidoFailed.add(
    !httpCorrecto
  );


  /*
  |--------------------------------------------------------------------------
  | VALIDAR RESPUESTA
  |--------------------------------------------------------------------------
  */

  let body = null;


  try {

    body =
      response.json();

  } catch {

    body = null;
  }


  const venta =

    body?.data ||

    body;


  check(
    response,
    {

      'Pedido web responde 200/201':
        () =>
          httpCorrecto,


      'Venta web creada':
        () =>
          Boolean(
            venta?.id_venta
          ),


      'Estado PENDIENTE_PAGO':
        () =>
          venta?.estado ===
          'PENDIENTE_PAGO',


      'Canal de venta WEB':
        () =>
          venta?.canal_venta ===
          'WEB',
    }
  );


  if (
    !httpCorrecto
  ) {

    console.error(
      `VU ${__VU} - HTTP ${response.status}: ${response.body}`
    );
  }
}