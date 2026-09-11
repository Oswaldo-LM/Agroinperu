import {
  DashboardResumen
} from '../models/dashboard.model';

import {
  DashboardRepository
} from '../repositories/dashboard.repository';


export class DashboardService {

  private dashboardRepository =
    new DashboardRepository();


  async obtenerResumen():
    Promise<DashboardResumen> {

    /*
     * Son consultas independientes.
     *
     * Promise.all permite ejecutarlas
     * simultáneamente.
     */

    const [
      ventas,
      pedidosWeb,
      pagos,
      productosBajoStock,
      ultimasVentas
    ] =
      await Promise.all([

        this.dashboardRepository
          .obtenerResumenVentasHoy(),

        this.dashboardRepository
          .obtenerPedidosWebPendientes(),

        this.dashboardRepository
          .obtenerResumenPagosHoy(),

        this.dashboardRepository
          .obtenerProductosBajoStock(),

        this.dashboardRepository
          .obtenerUltimasVentas()
      ]);


    return {

      ventas,

      pedidos_web:
        pedidosWeb,

      pagos,

      productos_bajo_stock:
        productosBajoStock,

      ultimas_ventas:
        ultimasVentas
    };
  }
}