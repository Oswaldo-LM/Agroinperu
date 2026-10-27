import { CategoriaService } from '../src/services/categoria.service';
import { CategoriaRepository } from '../src/repositories/categoria.repository';
import { Categoria } from '../src/models/categoria.model';

// Mockeamos el repositorio para pruebas unitarias puras y aisladas
jest.mock('../src/repositories/categoria.repository');

describe('CategoriaService - Pruebas Unitarias (xUnit / Jest)', () => {
  let service: CategoriaService;
  let mockRepository: jest.Mocked<CategoriaRepository>;

  const categoriaMockActiva: Categoria = {
    id_categoria: 1,
    nombre: 'Abonos Orgánicos',
    descripcion: 'Fertilizantes y compost natural',
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-01-01'),
    fecha_actualizacion: new Date('2026-01-01')
  };

  const categoriaMockInactiva: Categoria = {
    ...categoriaMockActiva,
    id_categoria: 2,
    nombre: 'Herramientas Viejas',
    estado: 'INACTIVO'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriaService();
    // Accedemos a la instancia mockeada del repositorio
    mockRepository = (service as any).categoriaRepository;
  });

  describe('validarId() y obtenerPorId()', () => {
    it('Debe lanzar error ID_INVALIDO si el ID es 0 o negativo', async () => {
      await expect(service.obtenerPorId(0)).rejects.toThrow('ID_INVALIDO');
      await expect(service.obtenerPorId(-10)).rejects.toThrow('ID_INVALIDO');
    });

    it('Debe lanzar error CATEGORIA_NO_ENCONTRADA si el repositorio devuelve null', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerPorId(999)).rejects.toThrow('CATEGORIA_NO_ENCONTRADA');
      expect(mockRepository.obtenerPorId).toHaveBeenCalledWith(999);
    });

    it('Debe retornar la categoría si existe', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(categoriaMockActiva);

      const resultado = await service.obtenerPorId(1);
      expect(resultado).toEqual(categoriaMockActiva);
      expect(resultado.nombre).toBe('Abonos Orgánicos');
    });
  });

  describe('crear()', () => {
    it('Debe rechazar la creación si el nombre viene vacío o en blanco', async () => {
      await expect(service.crear({ nombre: '   ' })).rejects.toThrow('NOMBRE_OBLIGATORIO');
    });

    it('Debe rechazar la creación si el nombre tiene menos de 2 caracteres', async () => {
      await expect(service.crear({ nombre: 'A' })).rejects.toThrow('NOMBRE_MUY_CORTO');
    });

    it('Debe rechazar la creación si el nombre supera los 80 caracteres', async () => {
      const nombreLargo = 'A'.repeat(81);
      await expect(service.crear({ nombre: nombreLargo })).rejects.toThrow('NOMBRE_MUY_LARGO');
    });

    it('Debe crear la categoría exitosamente si los datos son correctos', async () => {
      mockRepository.crear.mockResolvedValue(categoriaMockActiva);

      const resultado = await service.crear({
        nombre: 'Abonos Orgánicos',
        descripcion: 'Fertilizantes y compost natural'
      });

      expect(mockRepository.crear).toHaveBeenCalled();
      expect(resultado.id_categoria).toBe(1);
    });
  });

  describe('desactivar()', () => {
    it('Debe lanzar error si la categoría ya se encuentra inactiva', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(categoriaMockInactiva);

      await expect(service.desactivar(2)).rejects.toThrow('CATEGORIA_YA_INACTIVA');
      expect(mockRepository.desactivar).not.toHaveBeenCalled();
    });

    it('Debe inactivar correctamente si la categoría está activa', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(categoriaMockActiva);
      mockRepository.desactivar.mockResolvedValue(true);

      await expect(service.desactivar(1)).resolves.not.toThrow();
      expect(mockRepository.desactivar).toHaveBeenCalledWith(1);
    });
  });

  describe('activar() [Nueva funcionalidad]', () => {
    it('Debe lanzar error CATEGORIA_NO_ENCONTRADA si la categoría no existe', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(null);

      await expect(service.activar(404)).rejects.toThrow('CATEGORIA_NO_ENCONTRADA');
      expect(mockRepository.activar).not.toHaveBeenCalled();
    });

    it('Debe lanzar error CATEGORIA_YA_ACTIVA si la categoría ya está activa', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(categoriaMockActiva);

      await expect(service.activar(1)).rejects.toThrow('CATEGORIA_YA_ACTIVA');
      expect(mockRepository.activar).not.toHaveBeenCalled();
    });

    it('Debe activar la categoría exitosamente si estaba inactiva', async () => {
      mockRepository.obtenerPorId.mockResolvedValue(categoriaMockInactiva);
      mockRepository.activar.mockResolvedValue(true);

      await expect(service.activar(2)).resolves.not.toThrow();
      expect(mockRepository.activar).toHaveBeenCalledWith(2);
    });
  });
});
