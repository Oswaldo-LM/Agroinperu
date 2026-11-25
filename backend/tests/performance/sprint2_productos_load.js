import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<250', 'avg<150'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://host.docker.internal:3000/api';

export default function () {
  const res = http.get(${BASE_URL}/productos);

  check(res, {
    'Sprint 2 - Listado de catalogo (200)': (r) => r.status === 200,
    'Sprint 2 - Tiempo de respuesta < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
