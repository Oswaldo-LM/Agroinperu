import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Configuracion de 15 usuarios concurrentes (Capitulo III)
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp-up
    { duration: '30s', target: 15 },  // Carga sostenida: 15 VUs
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'avg<180'], // 95% < 300ms, promedio < 180ms
    http_req_failed: ['rate<0.01'],              // Fallos < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://host.docker.internal:3000/api';

export default function () {
  group('1. Catalogo e Inventario (Sprint 2)', function () {
    const resProd = http.get(BASE_URL + '/productos');
    check(resProd, {
      'Catalogo status 200': (r) => r.status === 200,
      'Catalogo resp < 200ms': (r) => r.timings.duration < 200,
    });
  });

  group('2. Categorias y Filtros (Sprint 2)', function () {
    const resCat = http.get(BASE_URL + '/categorias');
    check(resCat, {
      'Categorias status 200': (r) => r.status === 200,
      'Categorias resp < 150ms': (r) => r.timings.duration < 150,
    });
  });

  group('3. Pedidos Web (Sprint 3)', function () {
    const resPed = http.get(BASE_URL + '/pedidos-web');
    check(resPed, {
      'Pedidos status 200/401': (r) => r.status === 200 || r.status === 401,
      'Pedidos resp < 250ms': (r) => r.timings.duration < 250,
    });
  });

  sleep(1);
}