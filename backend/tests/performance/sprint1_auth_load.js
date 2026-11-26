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
    checks: ['rate>0.99'],
  },
};

const BASE_URL =
  __ENV.API_URL || 'http://host.docker.internal:3000/api';

export default function () {

  const payload = JSON.stringify({
    email: 'cliente@agroinperu.com',
    password: 'Cliente12345',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const res = http.post(
    `${BASE_URL}/auth/clientes/login`,
    payload,
    params
  );

  check(res, {
    'Sprint 1 - Login responde 200': (r) =>
      r.status === 200,

    'Sprint 1 - Login genera token JWT': (r) => {
      try {
        const body = r.json();

        return Boolean(
          body?.token ||
          body?.data?.token
        );
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}