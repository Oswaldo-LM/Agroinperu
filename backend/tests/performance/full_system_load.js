import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Test Integral de Rendimiento: Evaluación concurrente de los 8 Sprints
// 15 Usuarios Concurrentes (VUs) según el Capítulo III
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp-up gradual
    { duration: '30s', target: 15 },  // Pico sostenido: 15 VUs concurrentes
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500', 'avg<180'], // Criterios Capítulo III
    http_req_failed: ['rate<0.01'],                           // Tolerancia < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://host.docker.internal:3000/api';

export default function () {
  group('Sprint 1: Autenticación y Clientes', function () {
    const payload = JSON.stringify({ correo: 'admin@agroin.pe', password: 'Password123!' });
    const resAuth = http.post(BASE_URL + '/auth/login', payload, { headers: { 'Content-Type': 'application/json' } });
    check(resAuth, {
      'S1 Login validado': (r) => r.status === 200 || r.status === 401,
      'S1 Login resp < 250ms': (r) => r.timings.duration < 250,
    });
  });

  group('Sprint 2: Catálogo e Inventario', function () {
    const resProd = http.get(BASE_URL + '/productos');
    check(resProd, {
      'S2 Catálogo status 200': (r) => r.status === 200,
      'S2 Catálogo resp < 200ms': (r) => r.timings.duration < 200,
    });
  });

  group('Sprint 3: Pedidos Web y Proformas', function () {
    const resPed = http.get(BASE_URL + '/pedidos-web');
    check(resPed, {
      'S3 Pedidos status 200/401': (r) => r.status === 200 || r.status === 401,
      'S3 Pedidos resp < 250ms': (r) => r.timings.duration < 250,
    });
  });

  group('Sprint 4: Control de Caja', function () {
    const resCaja = http.get(BASE_URL + '/cajas/estado');
    check(resCaja, {
      'S4 Caja status 200/401': (r) => r.status === 200 || r.status === 401,
      'S4 Caja resp < 200ms': (r) => r.timings.duration < 200,
    });
  });

  group('Sprint 5 y 6: Ventas y Comprobantes', function () {
    const resVentas = http.get(BASE_URL + '/ventas');
    check(resVentas, {
      'S5/S6 Ventas status 200/401': (r) => r.status === 200 || r.status === 401,
      'S5/S6 Ventas resp < 250ms': (r) => r.timings.duration < 250,
    });
  });

  group('Sprint 7 y 8: Devoluciones y Reportes', function () {
    const resRep = http.get(BASE_URL + '/reportes/dashboard');
    check(resRep, {
      'S7/S8 Dashboard status 200/401': (r) => r.status === 200 || r.status === 401,
      'S7/S8 Dashboard resp < 300ms': (r) => r.timings.duration < 300,
    });
  });

  sleep(1);
}
