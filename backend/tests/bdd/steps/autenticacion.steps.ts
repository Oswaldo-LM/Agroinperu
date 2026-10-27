import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { AuthService } from '../../../src/services/auth.service';

let authService: AuthService;
let clienteSimulado: any = null;
let respuestaLogin: any = null;
let errorLogin: Error | null = null;

Before(function () {
  process.env.JWT_SECRET = 'clave_secreta_para_pruebas_bdd_cucumber_12345';
  authService = new AuthService();
  clienteSimulado = null;
  respuestaLogin = null;
  errorLogin = null;

  const mockAuthRepo = {
    obtenerClientePorEmail: async (email: string) => {
      if (clienteSimulado && clienteSimulado.email === email) {
        return clienteSimulado;
      }
      return null;
    },
    obtenerUsuarioPorEmail: async () => null
  };

  (authService as any).authRepository = mockAuthRepo;
});

Given('que existe un cliente registrado con email {string} y estado {string}', function (email: string, estado: string) {
  clienteSimulado = {
    id_cliente: 1,
    nombres: 'Juan',
    apellidos: 'Perez',
    razon_social: null,
    email,
    password_hash: '',
    estado
  };
});

Given('su contraseña almacenada es {string}', async function (passwordPlano: string) {
  // Generamos el hash real con bcrypt para probar la autenticación criptográfica
  const salt = await bcrypt.genSalt(6);
  clienteSimulado.password_hash = await bcrypt.hash(passwordPlano, salt);
});

When('el cliente intenta iniciar sesión con email {string} y contraseña {string}', async function (email: string, password: string) {
  try {
    respuestaLogin = await authService.loginCliente({ email, password });
    errorLogin = null;
  } catch (err: any) {
    errorLogin = err;
    respuestaLogin = null;
  }
});

Then('el sistema autoriza el acceso', function () {
  assert.strictEqual(errorLogin, null, 'No debe haber error');
  assert.ok(respuestaLogin, 'Debe haber una respuesta exitosa');
  assert.strictEqual(respuestaLogin.usuario.email, clienteSimulado.email);
});

Then('el sistema genera un token de autenticación JWT', function () {
  assert.ok(respuestaLogin.token, 'Debe existir un token JWT generado');
  assert.strictEqual(typeof respuestaLogin.token, 'string');
  assert.ok(respuestaLogin.token.length > 20);
});

Then('el sistema deniega el acceso con el error {string}', function (mensajeEsperado: string) {
  assert.ok(errorLogin, 'Se esperaba que el inicio de sesión fallara');
  assert.strictEqual(errorLogin.message, mensajeEsperado);
});
