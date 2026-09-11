import {
  EstadoVenta
} from './venta.model';


export interface ResumenVentasDia {

  fecha: string;

  cantidad_ventas: number;

  total_vendido: number;

  ventas_web: number;

  total_web: number;

  ventas_tienda: number;

  total_tienda: number;
}


export interface ResumenPedidosWeb {

  pendiente_pago: number;

  pagada: number;

  en_preparacion: number;

  lista_para_recoger: number;

  total_pendientes: number;
}


export interface ResumenPagosDia {

  pendientes: number;

  aprobados: number;

  rechazados: number;

  anulados: number;

  reembolsados: number;

  monto_aprobado: number;
}


export interface ProductoBajoStock {

  id_producto: number;

  codigo: string;

  nombre: string;

  stock_disponible: number;

  stock_reservado: number;

  stock_minimo: number;

  stock_fisico: number;
}


export interface UltimaVenta {

  id_venta: number;

  codigo_venta: string;

  canal_venta:
    | 'WEB'
    | 'TIENDA';

  estado: EstadoVenta;

  cliente_nombre:
    string | null;

  usuario_nombre:
    string | null;

  total: number;

  fecha_creacion: Date;
}


export interface DashboardResumen {

  ventas:
    ResumenVentasDia;

  pedidos_web:
    ResumenPedidosWeb;

  pagos:
    ResumenPagosDia;

  productos_bajo_stock:
    ProductoBajoStock[];

  ultimas_ventas:
    UltimaVenta[];
}