import http from 'k6/http';
import { check, sleep } from 'k6';

// Sprint 7: DEVOLUCIONES - Registro y consulta de devoluciones
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
  const res = http.get(BASE_URL + '/devoluciones');

  check(res, {
    'Sprint 7 - Consulta de devoluciones (200 o 401)': (r) => r.status === 200 || r.status === 401,
    'Sprint 7 - Tiempo de respuesta < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
