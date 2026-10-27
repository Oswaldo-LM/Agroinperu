import { DashboardService } from '../src/services/dashboard.service';
import { DashboardRepository } from '../src/repositories/dashboard.repository';

jest.mock('../src/repositories/dashboard.repository');

describe('DashboardService - Pruebas Unitarias de Agregación de Métricas (xUnit / Jest)', () => {
  let service: DashboardService;
  let mockDashboardRepo: jest.Mocked<DashboardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
    mockDashboardRepo = (service as any).dashboardRepository;
  });

  describe('obtenerResumen()', () => {
    it('Debe consultar concurrentemente todas las métricas operativas del negocio', async () => {
      const mockVentas = { total_ventas: 5420.00, cantidad_ventas: 18 };
      const mockPedidosWeb = { pendientes: 4, monto_total: 1250.00 };
      const mockPagos = { total_efectivo: 3200.00, total_tarjeta: 2220.00 };
      const mockBajoStock = [
        { id_producto: 5, codigo: 'RIE-001', nombre: 'Cinta Goteo', stock_disponible: 2, stock_minimo: 5 }
      ];
      const mockUltimasVentas = [
        { id_venta: 101, numero_comprobante: 'B001-00045', cliente: 'Juan Perez', total: 180.00, fecha: new Date() }
      ];

      mockDashboardRepo.obtenerResumenVentasHoy.mockResolvedValue(mockVentas as any);
      mockDashboardRepo.obtenerPedidosWebPendientes.mockResolvedValue(mockPedidosWeb as any);
      mockDashboardRepo.obtenerResumenPagosHoy.mockResolvedValue(mockPagos as any);
      mockDashboardRepo.obtenerProductosBajoStock.mockResolvedValue(mockBajoStock as any);
      mockDashboardRepo.obtenerUltimasVentas.mockResolvedValue(mockUltimasVentas as any);

      const resumen = await service.obtenerResumen();

      expect(resumen).toBeDefined();
      expect(resumen.ventas).toEqual(mockVentas);
      expect(resumen.pedidos_web).toEqual(mockPedidosWeb);
      expect(resumen.pagos).toEqual(mockPagos);
      expect(resumen.productos_bajo_stock).toHaveLength(1);
      expect(resumen.ultimas_ventas).toHaveLength(1);

      // Verificar que todos los repositorios fueron llamados concurrentemente
      expect(mockDashboardRepo.obtenerResumenVentasHoy).toHaveBeenCalledTimes(1);
      expect(mockDashboardRepo.obtenerPedidosWebPendientes).toHaveBeenCalledTimes(1);
      expect(mockDashboardRepo.obtenerResumenPagosHoy).toHaveBeenCalledTimes(1);
      expect(mockDashboardRepo.obtenerProductosBajoStock).toHaveBeenCalledTimes(1);
      expect(mockDashboardRepo.obtenerUltimasVentas).toHaveBeenCalledTimes(1);
    });

    it('Debe propagar error si alguna consulta del dashboard falla', async () => {
      mockDashboardRepo.obtenerResumenVentasHoy.mockRejectedValue(new Error('DATABASE_CONNECTION_ERROR'));
      mockDashboardRepo.obtenerPedidosWebPendientes.mockResolvedValue({} as any);
      mockDashboardRepo.obtenerResumenPagosHoy.mockResolvedValue({} as any);
      mockDashboardRepo.obtenerProductosBajoStock.mockResolvedValue([] as any);
      mockDashboardRepo.obtenerUltimasVentas.mockResolvedValue([] as any);

      await expect(service.obtenerResumen()).rejects.toThrow('DATABASE_CONNECTION_ERROR');
    });
  });
});
