import {
  Before,
  Given,
  When,
  Then
} from '@cucumber/cucumber';

import assert from 'node:assert/strict';

import {
  VentaService
} from '../../../src/services/venta.service';

import {
  pool
} from '../../../src/config/database';


let ventaService: VentaService;

let resultado: any;
let errorCapturado: any;

let commitEjecutado = false;
let rollbackEjecutado = false;

let carritoMock: any;
let productosMock: any[] = [];
let pedidosMock: any[] = [];


// -------------------------------------------------------
// CONEXIÓN MOCK
// -------------------------------------------------------

const connectionMock: any = {

  beginTransaction: async () => {},

  commit: async () => {
    commitEjecutado = true;
  },

  rollback: async () => {
    rollbackEjecutado = true;
  },

  release: () => {}
};


// -------------------------------------------------------
// RESET
// -------------------------------------------------------

Before(function () {

  resultado = undefined;
  errorCapturado = undefined;

  commitEjecutado = false;
  rollbackEjecutado = false;

  carritoMock = null;
  productosMock = [];
  pedidosMock = [];

  ventaService = new VentaService();

  /*
   * Evitamos utilizar la BD real.
   */
  (pool as any).getConnection =
    async () => connectionMock;


  const repository =
    (ventaService as any).ventaRepository;


  repository.obtenerCarritoActivoConBloqueo =
    async () => carritoMock;


  repository.obtenerDetallesConBloqueo =
    async () => productosMock;


  repository.crearVenta =
    async () => 100;


  repository.crearDetalle =
    async () => {};


  repository.actualizarStockReserva =
    async () => {};


  repository.registrarMovimientoReserva =
    async () => {};


  repository.registrarHistorialCreacion =
    async () => {};


  repository.convertirCarrito =
    async () => {};


  repository.listarVentasWebPorCliente =
    async () => pedidosMock;
});


// -------------------------------------------------------
// VENTA EXITOSA
// -------------------------------------------------------

Given(
  'que existe un cliente válido con un carrito activo',
  function () {

    carritoMock = {
      id_carrito: 20,
      cliente_id: 1,
      estado: 'ACTIVO'
    };
  }
);


Given(
  'el carrito contiene un producto activo con stock disponible',
  function () {

    productosMock = [
      {
        producto_id: 10,
        codigo: 'PROD-001',
        nombre: 'Manguera HDPE',
        unidad_medida: 'METRO',

        precio: 10,

        cantidad: 2,

        stock_disponible: 100,
        stock_reservado: 0,

        estado: 'ACTIVO',
        visible_web: 1
      }
    ];
  }
);


When(
  'el cliente confirma su venta web',
  async function () {

    try {

      resultado =
        await ventaService
          .confirmarVentaWeb(1);

    } catch (error) {

      errorCapturado = error;
    }
  }
);


Then(
  'la venta se registra correctamente',
  function () {

    assert.equal(
      errorCapturado,
      undefined
    );

    assert.ok(resultado);

    assert.equal(
      resultado.id_venta,
      100
    );
  }
);


Then(
  'la venta queda en estado {string}',
  function (estado: string) {

    assert.equal(
      resultado.estado,
      estado
    );
  }
);


Then(
  'el canal de venta es {string}',
  function (canal: string) {

    assert.equal(
      resultado.canal_venta,
      canal
    );
  }
);


Then(
  'el stock del producto queda reservado',
  function () {

    assert.ok(
      resultado.detalles.length > 0
    );

    assert.equal(
      resultado.detalles[0].cantidad,
      2
    );
  }
);


Then(
  'la transacción es confirmada',
  function () {

    assert.equal(
      commitEjecutado,
      true
    );

    assert.equal(
      rollbackEjecutado,
      false
    );
  }
);


// -------------------------------------------------------
// CARRITO VACÍO
// -------------------------------------------------------

Given(
  'que existe un cliente válido con un carrito activo vacío',
  function () {

    carritoMock = {
      id_carrito: 30,
      cliente_id: 1,
      estado: 'ACTIVO'
    };

    productosMock = [];
  }
);


Then(
  'la venta web es rechazada con el error {string}',
  function (errorEsperado: string) {

    assert.ok(errorCapturado);

    assert.equal(
      (errorCapturado as Error).message,
      errorEsperado
    );
  }
)


// -------------------------------------------------------
// STOCK INSUFICIENTE
// -------------------------------------------------------

Given(
  'el carrito solicita una cantidad superior al stock disponible',
  function () {

    productosMock = [
      {
        producto_id: 15,
        codigo: 'PROD-015',
        nombre: 'Tubería PVC',
        unidad_medida: 'UNIDAD',

        precio: 25,

        cantidad: 20,

        stock_disponible: 5,
        stock_reservado: 0,

        estado: 'ACTIVO',
        visible_web: 1
      }
    ];
  }
);


Then(
  'el sistema rechaza la operación por stock insuficiente',
  function () {

    assert.ok(errorCapturado);

    assert.match(
      (errorCapturado as Error).message,
      /^STOCK_INSUFICIENTE:/
    );
  }
);


Then(
  'la transacción es revertida',
  function () {

    assert.equal(
      rollbackEjecutado,
      true
    );

    assert.equal(
      commitEjecutado,
      false
    );
  }
);


// -------------------------------------------------------
// MIS PEDIDOS
// -------------------------------------------------------

Given(
  'que existe un cliente válido con pedidos web registrados',
  function () {

    pedidosMock = [
      {
        id_venta: 101,
        cliente_id: 1,
        codigo_venta: 'WEB-001',
        canal_venta: 'WEB',
        estado: 'PENDIENTE_PAGO'
      },

      {
        id_venta: 102,
        cliente_id: 1,
        codigo_venta: 'WEB-002',
        canal_venta: 'WEB',
        estado: 'PAGADA'
      }
    ];
  }
);


When(
  'el cliente consulta sus pedidos',
  async function () {

    resultado =
      await ventaService
        .listarMisPedidos(1);
  }
);


Then(
  'el sistema devuelve únicamente sus pedidos web',
  function () {

    assert.ok(
      Array.isArray(resultado)
    );

    assert.equal(
      resultado.length,
      2
    );

    for (const pedido of resultado) {

      assert.equal(
        pedido.cliente_id,
        1
      );

      assert.equal(
        pedido.canal_venta,
        'WEB'
      );
    }
  }
);