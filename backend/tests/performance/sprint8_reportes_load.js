import http from 'k6/http';
import { check, sleep } from 'k6';

// Sprint 8: REPORTES Y DASHBOARD - Indicadores en tiempo real
export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<350', 'avg<200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://host.docker.internal:3000/api';

export default function () {
  const res = http.get(BASE_URL + '/reportes/dashboard');

  check(res, {
    'Sprint 8 - Resumen dashboard (200 o 401)': (r) => r.status === 200 || r.status === 401,
    'Sprint 8 - Tiempo de respuesta < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
