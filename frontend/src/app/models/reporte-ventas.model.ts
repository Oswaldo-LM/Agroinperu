export interface ResumenReporteVentas {

  desde: string;

  hasta: string;

  cantidad_ventas: number;

  subtotal: number;

  igv: number;

  total_vendido: number;
}


export type FilaReporte =
  Record<
    string,
    unknown
  >;


export interface ReporteVentas {

  resumen:
    ResumenReporteVentas;

  por_canal:
    FilaReporte[];

  productos_mas_vendidos:
    FilaReporte[];

  metodos_pago:
    FilaReporte[];

  ventas:
    FilaReporte[];
}


export interface ReporteVentasResponse {

  success: boolean;

  message?: string;

  data:
    ReporteVentas;
}