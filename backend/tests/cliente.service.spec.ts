import { ClienteService } from '../src/services/cliente.service';
import { ClienteRepository } from '../src/repositories/cliente.repository';
import { Cliente } from '../src/models/cliente.model';

jest.mock('../src/repositories/cliente.repository');

describe('ClienteService - Pruebas Unitarias (xUnit / Jest)', () => {
  let service: ClienteService;
  let mockRepository: jest.Mocked<ClienteRepository>;

  const clienteActivoMock: Cliente = {
    id_cliente: 10,
    tipo_cliente: 'PERSONA',
    tipo_documento: 'DNI',
    numero_documento: '72345678',
    nombres: 'Carlos',
    apellidos: 'Mendoza',
    razon_social: null,
    email: 'carlos@ejemplo.com',
    telefono: '987654321',
    direccion: 'Av. Primavera 123',
    estado: 'ACTIVO',
    fecha_registro: new Date('2026-01-01'),
    fecha_actualizacion: new Date('2026-01-01')
  };

  const clienteInactivoMock: Cliente = {
    ...clienteActivoMock,
    id_cliente: 11,
    estado: 'INACTIVO'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClienteService();
    mockRepository = (service as any).clienteRepository;
  });

  describe('validarId() y obtenerPorId()', () => {
    it('Debe rechazar IDs menores o iguales a cero con error ID_INVALIDO', async () => {
      await expect(service.obtenerPorId(0)).rejects.toThrow('ID_INVALIDO');
      await expect(service.obtenerPorId(-1)).rejects.toThrow('ID_INVALIDO');
    });

    it('Debe lanzar CLIENTE_NO_ENCONTRADO si no existe en la base de datos', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerPorId(999)).rejects.toThrow('CLIENTE_NO_ENCONTRADO');
    });

    it('Debe retornar el cliente encontrado', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(clienteActivoMock);

      const cliente = await service.obtenerPorId(10);
      expect(cliente).toEqual(clienteActivoMock);
      expect(cliente.numero_documento).toBe('72345678');
    });
  });

  describe('desactivar()', () => {
    it('Debe rechazar desactivar un cliente que ya se encuentra INACTIVO', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(clienteInactivoMock);

      await expect(service.desactivar(11)).rejects.toThrow('CLIENTE_YA_INACTIVO');
      expect(mockRepository.desactivar).not.toHaveBeenCalled();
    });

    it('Debe inactivar un cliente activo correctamente', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(clienteActivoMock);
      mockRepository.desactivar.mockResolvedValue(true);

      await expect(service.desactivar(10)).resolves.not.toThrow();
      expect(mockRepository.desactivar).toHaveBeenCalledWith(10);
    });
  });

  describe('activar() [Nueva funcionalidad]', () => {
    it('Debe lanzar CLIENTE_NO_ENCONTRADO si el ID a activar no existe', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(null);

      await expect(service.activar(999)).rejects.toThrow('CLIENTE_NO_ENCONTRADO');
      expect(mockRepository.activar).not.toHaveBeenCalled();
    });

    it('Debe lanzar CLIENTE_YA_ACTIVO si el cliente ya está activo', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(clienteActivoMock);

      await expect(service.activar(10)).rejects.toThrow('CLIENTE_YA_ACTIVO');
      expect(mockRepository.activar).not.toHaveBeenCalled();
    });

    it('Debe activar al cliente exitosamente si su estado es INACTIVO', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(clienteInactivoMock);
      mockRepository.activar.mockResolvedValue(true);

      await expect(service.activar(11)).resolves.not.toThrow();
      expect(mockRepository.activar).toHaveBeenCalledWith(11);
    });
  });
});
