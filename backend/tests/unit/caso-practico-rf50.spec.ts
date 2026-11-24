import { ProductoService } from '../../src/services/producto.service';
import { ProductoRepository } from '../../src/repositories/producto.repository';
import { CategoriaRepository } from '../../src/repositories/categoria.repository';
import { Producto, CrearProductoDto } from '../../src/models/producto.model';
import { Categoria } from '../../src/models/categoria.model';

jest.mock('../../src/repositories/producto.repository');
jest.mock('../../src/repositories/categoria.repository');

describe('Caso Práctico RF-50: ProductoService.crear() - Caja Negra y Caja Blanca', () => {
  let service: ProductoService;
  let mockProductoRepo: jest.Mocked<ProductoRepository>;
  let mockCategoriaRepo: jest.Mocked<CategoriaRepository>;

  const categoriaActiva: Categoria = {
    id_categoria: 10,
    nombre: 'Sistemas de Riego',
    descripcion: 'Equipos y mangueras para goteo',
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-01-01'),
    fecha_actualizacion: new Date('2026-01-01')
  };

  const categoriaInactiva: Categoria = {
    ...categoriaActiva,
    id_categoria: 11,
    estado: 'INACTIVO'
  };

  const dtoBaseValido: CrearProductoDto = {
    categoria_id: 10,
    codigo: 'RIE-050',
    nombre: 'Manguera de Riego Tecnificado 16mm',
    descripcion: 'Rollo agrícola de alta resistencia',
    unidad_medida: 'ROLLO',
    precio: 145.00,
    stock_disponible: 20,
    stock_minimo: 5,
    imagen_url: 'https://agroinperu.pe/img/manguera-16mm.png',
    visible_web: true,
    codigo_barras: '7751234567890'
  };

  const productoCreadoMock: Producto = {
    id_producto: 50,
    categoria_id: 10,
    codigo: 'RIE-050',
    nombre: 'Manguera de Riego Tecnificado 16mm',
    descripcion: 'Rollo agrícola de alta resistencia',
    unidad_medida: 'ROLLO',
    precio: 145.00,
    stock_disponible: 20,
    stock_reservado: 0,
    stock_minimo: 5,
    imagen_url: 'https://agroinperu.pe/img/manguera-16mm.png',
    visible_web: true,
    estado: 'ACTIVO',
    fecha_creacion: new Date('2026-11-20'),
    fecha_actualizacion: new Date('2026-11-20'),
    codigo_barras: '7751234567890'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductoService();
    mockProductoRepo = (service as any).productoRepository;
    mockCategoriaRepo = (service as any).categoriaRepository;

    mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaActiva);
    mockProductoRepo.obtenerPorCodigoBarrasExistente.mockResolvedValue(null);
    mockProductoRepo.obtenerPorCodigo.mockResolvedValue(null);
    mockProductoRepo.crear.mockResolvedValue(productoCreadoMock);
  });

  // =========================================================================
  // 1. PRUEBAS DE CAJA NEGRA (Partición de Equivalencia y Valores Límite)
  // =========================================================================
  describe('Pruebas de Caja Negra - RF-50', () => {
    it('CP-1: Valor límite inferior válido (nombre=2 chars, codigo=1 char, precio=0, stock=0)', async () => {
      const entrada: CrearProductoDto = {
        ...dtoBaseValido,
        codigo: 'P',
        nombre: 'AB',
        precio: 0,
        stock_disponible: 0,
        stock_minimo: 0
      };

      const resultado = await service.crear(entrada);
      expect(resultado).toEqual(productoCreadoMock);
      expect(mockProductoRepo.crear).toHaveBeenCalledTimes(1);
    });

    it('CP-2: Valor límite inválido justo fuera del rango (precio = -0.01)', async () => {
      await expect(
        service.crear({ ...dtoBaseValido, precio: -0.01 })
      ).rejects.toThrow('PRECIO_INVALIDO');
    });

    it('CP-3: Partición inválida por unicidad de código interno (RF-53)', async () => {
      mockProductoRepo.obtenerPorCodigo.mockResolvedValue(productoCreadoMock);

      await expect(
        service.crear({ ...dtoBaseValido, codigo: 'RIE-050' })
      ).rejects.toThrow('CODIGO_PRODUCTO_DUPLICADO');
    });

    it('CP-4: Valor límite inferior inválido en nombre (1 carácter)', async () => {
      await expect(
        service.crear({ ...dtoBaseValido, nombre: 'A' })
      ).rejects.toThrow('NOMBRE_MUY_CORTO');
    });

    it('CP-5: Valor límite superior válido en nombre (150 caracteres)', async () => {
      const resultado = await service.crear({
        ...dtoBaseValido,
        nombre: 'N'.repeat(150)
      });
      expect(resultado).toEqual(productoCreadoMock);
    });

    it('CP-6: Valor límite superior inválido en nombre (151 caracteres)', async () => {
      await expect(
        service.crear({ ...dtoBaseValido, nombre: 'N'.repeat(151) })
      ).rejects.toThrow('NOMBRE_MUY_LARGO');
    });

    it('CP-7: Partición inválida por categoría en estado INACTIVO (RF-52)', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaInactiva);

      await expect(
        service.crear({ ...dtoBaseValido, categoria_id: 11 })
      ).rejects.toThrow('CATEGORIA_INACTIVA');
    });

    it('CP-8: Partición inválida por duplicidad de código de barras (RF-53)', async () => {
      mockProductoRepo.obtenerPorCodigoBarrasExistente.mockResolvedValue(productoCreadoMock);

      await expect(
        service.crear(dtoBaseValido)
      ).rejects.toThrow('CODIGO_BARRAS_DUPLICADO');
    });
  });

  // =========================================================================
  // 2. PRUEBAS DE CAJA BLANCA (100 % Cobertura de Decisiones / Ramas)
  // =========================================================================
  describe('Pruebas de Caja Blanca - Cobertura de Decisiones 100 %', () => {
    it('C1: D1 verdadera -> Categoría no encontrada', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(null);
      await expect(service.crear({ ...dtoBaseValido, categoria_id: 999 })).rejects.toThrow('CATEGORIA_NO_ENCONTRADA');
    });

    it('C2: D1 falsa, D2 verdadera -> Categoría inactiva', async () => {
      mockCategoriaRepo.obtenerPorId.mockResolvedValue(categoriaInactiva);
      await expect(service.crear({ ...dtoBaseValido, categoria_id: 11 })).rejects.toThrow('CATEGORIA_INACTIVA');
    });

    it('C3: D3 verdadera -> Código interno obligatorio (vacío)', async () => {
      await expect(service.crear({ ...dtoBaseValido, codigo: '   ' })).rejects.toThrow('CODIGO_OBLIGATORIO');
    });

    it('C4: D3 falsa, D4 verdadera -> Código interno > 30 caracteres', async () => {
      await expect(service.crear({ ...dtoBaseValido, codigo: 'C'.repeat(31) })).rejects.toThrow('CODIGO_MUY_LARGO');
    });

    it('C5: D5 verdadera -> Nombre obligatorio (vacío)', async () => {
      await expect(service.crear({ ...dtoBaseValido, nombre: '' })).rejects.toThrow('NOMBRE_OBLIGATORIO');
    });

    it('C6: D5 falsa, D6 verdadera -> Nombre < 2 caracteres', async () => {
      await expect(service.crear({ ...dtoBaseValido, nombre: 'X' })).rejects.toThrow('NOMBRE_MUY_CORTO');
    });

    it('C7: D6 falsa, D7 verdadera -> Nombre > 150 caracteres', async () => {
      await expect(service.crear({ ...dtoBaseValido, nombre: 'X'.repeat(151) })).rejects.toThrow('NOMBRE_MUY_LARGO');
    });

    it('C8: D8 verdadera -> Descripción > 500 caracteres', async () => {
      await expect(service.crear({ ...dtoBaseValido, descripcion: 'D'.repeat(501) })).rejects.toThrow('DESCRIPCION_MUY_LARGA');
    });

    it('C9: D9 verdadera -> Unidad de medida fuera de dominio', async () => {
      await expect(service.crear({ ...dtoBaseValido, unidad_medida: 'LITRO' as any })).rejects.toThrow('UNIDAD_MEDIDA_INVALIDA');
    });

    it('C10: D10 verdadera -> Precio negativo o NaN', async () => {
      await expect(service.crear({ ...dtoBaseValido, precio: -10 })).rejects.toThrow('PRECIO_INVALIDO');
      await expect(service.crear({ ...dtoBaseValido, precio: NaN })).rejects.toThrow('PRECIO_INVALIDO');
    });

    it('C11: D11 verdadera -> Stock disponible negativo', async () => {
      await expect(service.crear({ ...dtoBaseValido, stock_disponible: -1 })).rejects.toThrow('STOCK_DISPONIBLE_INVALIDO');
    });

    it('C12: D12 verdadera -> Stock mínimo negativo', async () => {
      await expect(service.crear({ ...dtoBaseValido, stock_minimo: -5 })).rejects.toThrow('STOCK_MINIMO_INVALIDO');
    });

    it('C13: D13 verdadera -> URL de imagen > 255 caracteres', async () => {
      await expect(service.crear({ ...dtoBaseValido, imagen_url: 'https://agroinperu.pe/' + 'a'.repeat(240) })).rejects.toThrow('IMAGEN_URL_MUY_LARGA');
    });

    it('C14: D14 verdadera -> Código de barras > 100 caracteres', async () => {
      await expect(service.crear({ ...dtoBaseValido, codigo_barras: '1'.repeat(101) })).rejects.toThrow('CODIGO_BARRAS_MUY_LARGO');
    });

    it('C15: D15 verdadera, D16 verdadera -> Código de barras duplicado', async () => {
      mockProductoRepo.obtenerPorCodigoBarrasExistente.mockResolvedValue(productoCreadoMock);
      await expect(service.crear(dtoBaseValido)).rejects.toThrow('CODIGO_BARRAS_DUPLICADO');
    });

    it('C16: D15 falsa (sin código barras), D17 verdadera -> Código interno duplicado', async () => {
      mockProductoRepo.obtenerPorCodigo.mockResolvedValue(productoCreadoMock);
      await expect(service.crear({ ...dtoBaseValido, codigo_barras: null })).rejects.toThrow('CODIGO_PRODUCTO_DUPLICADO');
    });

    it('C17: D15 verdadera, D16 falsa, D17 falsa -> Creación exitosa con código de barras', async () => {
      const resultado = await service.crear(dtoBaseValido);
      expect(resultado).toEqual(productoCreadoMock);
      expect(mockProductoRepo.obtenerPorCodigoBarrasExistente).toHaveBeenCalledWith('7751234567890');
    });

    it('C18: D15 falsa, D17 falsa -> Creación exitosa sin código de barras (null)', async () => {
      const resultado = await service.crear({ ...dtoBaseValido, codigo_barras: null });
      expect(resultado).toEqual(productoCreadoMock);
      expect(mockProductoRepo.obtenerPorCodigoBarrasExistente).not.toHaveBeenCalled();
    });
  });
});
