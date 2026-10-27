import { ProductoService } from '../src/services/producto.service';
import { ProductoRepository } from '../src/repositories/producto.repository';
import { CategoriaRepository } from '../src/repositories/categoria.repository';
import { Producto, CrearProductoDto, ActualizarProductoDto } from '../src/models/producto.model';
import { Categoria } from '../src/models/categoria.model';

jest.mock('../src/repositories/producto.repository');
jest.mock('../src/repositories/categoria.repository');

describe('ProductoService - Pruebas Unitarias (xUnit / Jest)', () => {
  let service: ProductoService;
  let mockProductoRepo: jest.Mocked<ProductoRepository>;
  let mockCategoriaRepo: jest.Mocked<CategoriaRepository>;

  const categoriaMockActiva: Categoria = {
    id_categoria: 10,
    nombre: 'Sistemas de Riego',
    descripcion: 'Equipos y mangueras para goteo',
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-01-01'),
    fecha_actualizacion: new Date('2026-01-01')
  };

  const categoriaMockInactiva: Categoria = {
    ...categoriaMockActiva,
    id_categoria: 11,
    estado: 'INACTIVO'
  };

  const productoMockActivo: Producto = {
    id_producto: 1,
    categoria_id: 10,
    codigo: 'RIE-001',
    nombre: 'Cinta de Riego por Goteo 16mm',
    descripcion: 'Rollo de 500m de cinta de riego',
    unidad_medida: 'ROLLO',
    precio: 180.50,
    stock_disponible: 25,
    stock_reservado: 0,
    stock_minimo: 5,
    imagen_url: 'https://agroinperu.pe/img/cinta.png',
    visible_web: true,
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-01-15'),
    fecha_actualizacion: new Date('2026-01-15'),
    codigo_barras: '7751234567890'
  };

  const productoMockInactivo: Producto = {
    ...productoMockActivo,
    id_producto: 2,
    codigo: 'RIE-002',
    estado: 'INACTIVO'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductoService();
    mockProductoRepo = (service as any).productoRepository;
    mockCategoriaRepo = (service as any).categoriaRepository;
  });

  describe('validarId() y obtenerPorId()', () => {
    it('Debe rechazar un ID menor o igual a cero con ID_INVALIDO', async () => {
      await expect(service.obtenerPorId(0)).rejects.toThrow('ID_INVALIDO');
      await expect(service.obtenerPorId(-5)).rejects.toThrow('ID_INVALIDO');
    });

    it('Debe lanzar PRODUCTO_NO_ENCONTRADO si el ID no existe en la base de datos', async () => {
      mockProductoRepo.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerPorId(999)).rejects.toThrow('PRODUCTO_NO_ENCONTRADO');
      expect(mockProductoRepo.obtenerPorId).toHaveBeenCalledWith(999);
    });

    it('Debe retornar el producto si existe', async () => {
      mockProductoRepo.obtenerPorId.mockResolvedValue(productoMockActivo);

      const resultado = await service.obtenerPorId(1);
      expect(resultado).toEqual(productoMockActivo);
      expect(resultado.codigo).toBe('RIE-001');
    });
  });

  describe('obtenerPorCodigo()', () => {
    it('Debe rechazar códigos vacíos con CODIGO_OBLIGATORIO', async () => {
      await expect(service.obtenerPorCodigo('')).rejects.toThrow('CODIGO_OBLIGATORIO');
      await expect(service.obtenerPorCodigo('   ')).rejects.toThrow('CODIGO_OBLIGATORIO');
    });

    it('Debe retornar el producto si el código existe', async () => {
      mockProductoRepo.obtenerPorCodigo.mockResolvedValue(productoMockActivo);

      const resultado = await service.obtenerPorCodigo('RIE-001');
      expect(resultado).toEqual(productoMockActivo);
      expect(mockProductoRepo.obtenerPorCodigo).toHaveBeenCalledWith('RIE-001');
    });
  });

  describe('crear()', () => {
    const dtoCreacionValido: CrearProductoDto = {
      categoria_id: 10,
      codigo: 'RIE-001',
      nombre: 'Cinta de Riego por Goteo 16mm',
      descripcion: 'Rollo de 500m',
      unidad_medida: 'ROLLO',
      precio: 180.50,
      stock_disponible: 25,
      stock_minimo: 5,
      codigo_barras: '7751234567890',
      visible_web: true
    };

    it('Debe rechazar la creación si la categoría asociada no existe', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(null);

      await expect(service.crear(dtoCreacionValido)).rejects.toThrow('CATEGORIA_NO_ENCONTRADA');
    });

    it('Debe rechazar la creación si la categoría asociada se encuentra inactiva', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockInactiva);

      await expect(service.crear(dtoCreacionValido)).rejects.toThrow('CATEGORIA_INACTIVA');
    });

    it('Debe rechazar si el código del producto es obligatorio o excede 30 caracteres', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);

      await expect(service.crear({ ...dtoCreacionValido, codigo: '' })).rejects.toThrow('CODIGO_OBLIGATORIO');
      await expect(service.crear({ ...dtoCreacionValido, codigo: 'C'.repeat(31) })).rejects.toThrow('CODIGO_MUY_LARGO');
    });

    it('Debe rechazar si el nombre del producto es muy corto o muy largo', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);

      await expect(service.crear({ ...dtoCreacionValido, nombre: 'A' })).rejects.toThrow('NOMBRE_MUY_CORTO');
      await expect(service.crear({ ...dtoCreacionValido, nombre: 'A'.repeat(151) })).rejects.toThrow('NOMBRE_MUY_LARGO');
    });

    it('Debe rechazar unidades de medida inválidas', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);

      await expect(service.crear({ ...dtoCreacionValido, unidad_medida: 'METRO_CUBICO' as any })).rejects.toThrow('UNIDAD_MEDIDA_INVALIDA');
    });

    it('Debe rechazar precios negativos o inválidos', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);

      await expect(service.crear({ ...dtoCreacionValido, precio: -10 })).rejects.toThrow('PRECIO_INVALIDO');
      await expect(service.crear({ ...dtoCreacionValido, precio: NaN })).rejects.toThrow('PRECIO_INVALIDO');
    });

    it('Debe rechazar si el código de barras ya pertenece a otro producto', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);
      mockProductoRepo.obtenerPorCodigoBarrasExistente.mockResolvedValue(productoMockActivo);

      await expect(service.crear(dtoCreacionValido)).rejects.toThrow('CODIGO_BARRAS_DUPLICADO');
    });

    it('Debe rechazar si el código del producto ya existe (código duplicado)', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);
      mockProductoRepo.obtenerPorCodigoBarrasExistente.mockResolvedValue(null);
      mockProductoRepo.obtenerPorCodigo.mockResolvedValue(productoMockActivo);

      await expect(service.crear(dtoCreacionValido)).rejects.toThrow('CODIGO_PRODUCTO_DUPLICADO');
    });

    it('Debe crear el producto exitosamente cuando todas las reglas de negocio se cumplen', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaMockActiva);
      mockProductoRepo.obtenerPorCodigoBarrasExistente.mockResolvedValue(null);
      mockProductoRepo.obtenerPorCodigo.mockResolvedValue(null);
      mockProductoRepo.crear.mockResolvedValue(productoMockActivo);

      const resultado = await service.crear(dtoCreacionValido);
      expect(resultado).toEqual(productoMockActivo);
      expect(mockProductoRepo.crear).toHaveBeenCalledTimes(1);
    });
  });

  describe('desactivar() y activar()', () => {
    it('Debe rechazar la desactivación si el producto ya está inactivo', async () => {
      mockProductoRepo.obtenerPorId.mockResolvedValue(productoMockInactivo);

      await expect(service.desactivar(2)).rejects.toThrow('PRODUCTO_YA_INACTIVO');
      expect(mockProductoRepo.desactivar).not.toHaveBeenCalled();
    });

    it('Debe desactivar exitosamente un producto activo', async () => {
      mockProductoRepo.obtenerPorId.mockResolvedValue(productoMockActivo);
      mockProductoRepo.desactivar.mockResolvedValue(undefined as any);

      await expect(service.desactivar(1)).resolves.not.toThrow();
      expect(mockProductoRepo.desactivar).toHaveBeenCalledWith(1);
    });

    it('Debe rechazar la activación si el producto ya está activo', async () => {
      mockProductoRepo.obtenerPorId.mockResolvedValue(productoMockActivo);

      await expect(service.activar(1)).rejects.toThrow('PRODUCTO_YA_ACTIVO');
      expect(mockProductoRepo.activar).not.toHaveBeenCalled();
    });

    it('Debe activar exitosamente un producto inactivo', async () => {
      mockProductoRepo.obtenerPorId.mockResolvedValue(productoMockInactivo);
      mockProductoRepo.activar.mockResolvedValue(undefined as any);

      await expect(service.activar(2)).resolves.not.toThrow();
      expect(mockProductoRepo.activar).toHaveBeenCalledWith(2);
    });
  });
});
