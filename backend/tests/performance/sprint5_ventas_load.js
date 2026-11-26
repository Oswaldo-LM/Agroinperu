import http from 'k6/http';
import { check, sleep } from 'k6';

// Sprint 5: VENTAS - Concurrencia de ventas presenciales y consulta de ventas
export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'avg<180'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://host.docker.internal:3000/api';

export default function () {
  const res = http.get(BASE_URL + '/ventas');

  check(res, {
    'Sprint 5 - Listado de ventas (200 o 401)': (r) => r.status === 200 || r.status === 401,
    'Sprint 5 - Tiempo de respuesta < 250ms': (r) => r.timings.duration < 250,
  });

  sleep(1);
}
