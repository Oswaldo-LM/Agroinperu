import { UsuarioService } from '../src/services/usuario.service';
import { UsuarioRepository } from '../src/repositories/usuario.repository';
import { Usuario } from '../src/models/usuario.model';

jest.mock('../src/repositories/usuario.repository');

describe('UsuarioService - Pruebas Unitarias (xUnit / Jest)', () => {
  let service: UsuarioService;
  let mockRepository: jest.Mocked<UsuarioRepository>;

  const adminActivo: Usuario = {
    id_usuario: 1,
    nombre: 'Administrador Principal',
    email: 'admin@agroinperu.com',
    rol: 'ADMIN',
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-01-01'),
    fecha_actualizacion: null
  };

  const cajeroActivo: Usuario = {
    id_usuario: 2,
    nombre: 'Cajero Tienda',
    email: 'cajero@agroinperu.com',
    rol: 'CAJERO',
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-01-01'),
    fecha_actualizacion: null
  };

  const cajeroInactivo: Usuario = {
    ...cajeroActivo,
    id_usuario: 3,
    estado: 'INACTIVO'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsuarioService();
    mockRepository = (service as any).usuarioRepository;
  });

  describe('Seguridad y Reglas de Inactivación (eliminar)', () => {
    it('No debe permitir que el administrador se inactive a sí mismo', async () => {
      await expect(service.eliminar(1, 1)).rejects.toThrow(
        'NO_PUEDE_DESACTIVAR_SU_PROPIA_CUENTA'
      );
    });

    it('No debe permitir inactivar al último administrador activo del sistema', async () => {
      const otroAdmin: Usuario = { ...adminActivo, id_usuario: 5 };
      mockRepository.obtenerPorId.mockResolvedValue(otroAdmin);
      mockRepository.contarAdminsActivos.mockResolvedValue(1);

      await expect(service.eliminar(1, 5)).rejects.toThrow('ULTIMO_ADMIN_ACTIVO');
    });

    it('Debe inactivar a un usuario cajero correctamente', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(cajeroActivo);
      mockRepository.desactivar.mockResolvedValue();

      await expect(service.eliminar(1, 2)).resolves.not.toThrow();
      expect(mockRepository.desactivar).toHaveBeenCalledWith(2);
    });
  });

  describe('activar() [Nueva funcionalidad]', () => {
    it('Debe rechazar la activación si el usuario ya se encuentra ACTIVO', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(cajeroActivo);

      await expect(service.activar(2)).rejects.toThrow('USUARIO_YA_ACTIVO');
      expect(mockRepository.activar).not.toHaveBeenCalled();
    });

    it('Debe lanzar USUARIO_NO_ENCONTRADO si el usuario no existe', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(null);

      await expect(service.activar(99)).rejects.toThrow('USUARIO_NO_ENCONTRADO');
    });

    it('Debe reactivar al usuario exitosamente si está INACTIVO', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(cajeroInactivo);
      mockRepository.activar.mockResolvedValue();

      await expect(service.activar(3)).resolves.not.toThrow();
      expect(mockRepository.activar).toHaveBeenCalledWith(3);
    });
  });
});
