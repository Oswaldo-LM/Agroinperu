import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '10s', target: 0 },
  ],

  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL =
  __ENV.API_URL || 'http://host.docker.internal:3000/api';

export function setup() {

  const payload = JSON.stringify({
    email: 'admin@agroinperu.com',
    password: 'Admin12345',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const res = http.post(
    `${BASE_URL}/auth/usuarios/login`,
    payload,
    params
  );

  check(res, {
    'Setup - Login administrador responde 200':
      (r) => r.status === 200,
  });

  if (res.status !== 200) {
    throw new Error(
      `No fue posible autenticar al usuario. Status: ${res.status} Body: ${res.body}`
    );
  }

  const body = res.json();

  const token =
    body?.token ||
    body?.data?.token;

  if (!token) {
    throw new Error(
      `Login correcto pero no se encontró JWT. Body: ${res.body}`
    );
  }

  return {
    token,
  };
}

export default function (data) {

  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      Accept: 'application/json',
    },
    tags: {
      endpoint: 'catalogo-productos',
    },
  };

  const res = http.get(
    `${BASE_URL}/productos`,
    params
  );

  check(res, {
    'Sprint 2 - Catalogo responde 200':
      (r) => r.status === 200,

    'Sprint 2 - Catalogo devuelve informacion':
      (r) => {
        try {
          const body = r.json();
          return body !== null && body !== undefined;
        } catch {
          return false;
        }
      },
  });

  sleep(1);
}