import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/services/auth.service';
import { AuthRepository } from '../src/repositories/auth.repository';

jest.mock('../src/repositories/auth.repository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService - Pruebas Unitarias de Autenticación y Seguridad (xUnit / Jest)', () => {
  let service: AuthService;
  let mockAuthRepo: jest.Mocked<AuthRepository>;
  const originalEnv = process.env;

  const mockClienteRow: any = {
    id_cliente: 15,
    nombres: 'Carlos',
    apellidos: 'Mendoza',
    razon_social: null,
    email: 'carlos.mendoza@gmail.com',
    password_hash: '$2b$10$hashed_password_mock',
    estado: 'ACTIVO'
  };

  const mockUsuarioRow: any = {
    id_usuario: 3,
    nombre: 'Admin Agroin',
    email: 'admin@agroinperu.pe',
    password_hash: '$2b$10$hashed_admin_password',
    rol: 'ADMIN',
    estado: 'ACTIVO'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: 'super_secret_test_key_12345' };
    service = new AuthService();
    mockAuthRepo = (service as any).authRepository;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Validación de formato de credenciales', () => {
    it('Debe rechazar el login si no se envían datos', async () => {
      await expect(service.loginCliente(null as any)).rejects.toThrow('DATOS_LOGIN_OBLIGATORIOS');
      await expect(service.loginUsuario(null as any)).rejects.toThrow('DATOS_LOGIN_OBLIGATORIOS');
    });

    it('Debe rechazar email vacío con EMAIL_OBLIGATORIO', async () => {
      await expect(
        service.loginCliente({ email: '   ', password: 'password123' })
      ).rejects.toThrow('EMAIL_OBLIGATORIO');
    });

    it('Debe validar la estructura sintáctica del email rechazando formatos inválidos', async () => {
      await expect(
        service.loginCliente({ email: 'correo-sin-arroba.com', password: 'password123' })
      ).rejects.toThrow('EMAIL_INVALIDO');

      await expect(
        service.loginCliente({ email: 'correo@dominio', password: 'password123' })
      ).rejects.toThrow('EMAIL_INVALIDO');
    });

    it('Debe rechazar una contraseña vacía con PASSWORD_OBLIGATORIO', async () => {
      await expect(
        service.loginCliente({ email: 'cliente@gmail.com', password: '' })
      ).rejects.toThrow('PASSWORD_OBLIGATORIO');
    });
  });

  describe('loginCliente()', () => {
    it('Debe rechazar con CREDENCIALES_INVALIDAS si el cliente no está registrado', async () => {
      mockAuthRepo.obtenerClientePorEmail.mockResolvedValue(null);

      await expect(
        service.loginCliente({ email: 'desconocido@correo.com', password: 'Password123' })
      ).rejects.toThrow('CREDENCIALES_INVALIDAS');
    });

    it('Debe rechazar el acceso si la cuenta del cliente está INACTIVA o BLOQUEADA', async () => {
      mockAuthRepo.obtenerClientePorEmail.mockResolvedValue({
        ...mockClienteRow,
        estado: 'INACTIVO'
      });

      await expect(
        service.loginCliente({ email: 'carlos.mendoza@gmail.com', password: 'Password123' })
      ).rejects.toThrow('CUENTA_NO_DISPONIBLE');
    });

    it('Debe rechazar con CREDENCIALES_INVALIDAS si la contraseña bcrypt es incorrecta', async () => {
      mockAuthRepo.obtenerClientePorEmail.mockResolvedValue(mockClienteRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.loginCliente({ email: 'carlos.mendoza@gmail.com', password: 'PasswordIncorrecta' })
      ).rejects.toThrow('CREDENCIALES_INVALIDAS');
    });

    it('Debe fallar si JWT_SECRET no está configurado en las variables de entorno', async () => {
      delete process.env.JWT_SECRET;
      mockAuthRepo.obtenerClientePorEmail.mockResolvedValue(mockClienteRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.loginCliente({ email: 'carlos.mendoza@gmail.com', password: 'PasswordCorrecta' })
      ).rejects.toThrow('JWT_SECRET_NO_CONFIGURADO');
    });

    it('Debe autenticar satisfactoriamente y emitir JWT para cliente válido', async () => {
      mockAuthRepo.obtenerClientePorEmail.mockResolvedValue(mockClienteRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_firmado_mock');

      const respuesta = await service.loginCliente({
        email: 'carlos.mendoza@gmail.com',
        password: 'PasswordCorrecta'
      });

      expect(respuesta.token).toBe('jwt_token_firmado_mock');
      expect(respuesta.usuario.id).toBe(15);
      expect(respuesta.usuario.email).toBe('carlos.mendoza@gmail.com');
      expect(respuesta.usuario.tipo_cuenta).toBe('CLIENTE');
      expect(respuesta.usuario.nombre).toBe('Carlos Mendoza');
    });
  });

  describe('loginUsuario() (Personal / Administradores)', () => {
    it('Debe rechazar con CREDENCIALES_INVALIDAS si el usuario no existe', async () => {
      mockAuthRepo.obtenerUsuarioPorEmail.mockResolvedValue(null);

      await expect(
        service.loginUsuario({ email: 'noexiste@agroinperu.pe', password: 'Password123' })
      ).rejects.toThrow('CREDENCIALES_INVALIDAS');
    });

    it('Debe impedir el login a usuarios internos con cuenta INACTIVA', async () => {
      mockAuthRepo.obtenerUsuarioPorEmail.mockResolvedValue({
        ...mockUsuarioRow,
        estado: 'INACTIVO'
      });

      await expect(
        service.loginUsuario({ email: 'admin@agroinperu.pe', password: 'Password123' })
      ).rejects.toThrow('CUENTA_NO_DISPONIBLE');
    });

    it('Debe autenticar con éxito a personal administrativo y retornar su rol correspondiente', async () => {
      mockAuthRepo.obtenerUsuarioPorEmail.mockResolvedValue(mockUsuarioRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_admin_mock');

      const respuesta = await service.loginUsuario({
        email: 'admin@agroinperu.pe',
        password: 'PasswordCorrecta'
      });

      expect(respuesta.token).toBe('jwt_token_admin_mock');
      expect(respuesta.usuario.id).toBe(3);
      expect(respuesta.usuario.tipo_cuenta).toBe('USUARIO');
      expect(respuesta.usuario.rol).toBe('ADMIN');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 3, tipo_cuenta: 'USUARIO', rol: 'ADMIN' },
        'super_secret_test_key_12345',
        { expiresIn: '2h' }
      );
    });
  });
});
