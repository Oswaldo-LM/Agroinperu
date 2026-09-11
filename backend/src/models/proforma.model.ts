export interface ProductoProformaDto {

  producto_id: number;

  cantidad: number;
}


export interface CrearProformaDto {

  cliente_id: number;

  fecha_vencimiento: string;

  observacion?:
    string | null;

  productos:
    ProductoProformaDto[];
}


export interface AnularProformaDto {

  motivo: string;
}