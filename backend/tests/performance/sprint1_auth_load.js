import http from 'k6/http';
import { check, sleep } from 'k6';

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
  const payload = JSON.stringify({
    correo: 'admin@agroin.pe',
    password: 'Password123!',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(${BASE_URL}/auth/login, payload, params);

  check(res, {
    'Sprint 1 - Login validado (200 o 401)': (r) => r.status === 200 || r.status === 401,
    'Sprint 1 - Tiempo de respuesta < 250ms': (r) => r.timings.duration < 250,
  });

  sleep(1);
}
