export interface ProductoDevolucionDto {

  detalle_venta_id: number;

  cantidad: number;
}


export interface CrearDevolucionDto {

  venta_id: number;

  motivo: string;

  productos:
    ProductoDevolucionDto[];
}