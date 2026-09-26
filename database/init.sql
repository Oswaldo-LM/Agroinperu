-- ============================================================
-- BASE DE DATOS
-- Sistema de Gestión de Ventas - AGROINPERU S.A.C.
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_agroinperu
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE db_agroinperu;


-- ============================================================
-- 1. TB_CLIENTE
-- ============================================================

CREATE TABLE TB_CLIENTE (
    id_cliente INT UNSIGNED AUTO_INCREMENT,
    
    tipo_cliente ENUM(
        'PERSONA',
        'EMPRESA'
    ) NOT NULL,

    tipo_documento ENUM(
        'DNI',
        'RUC',
        'CE',
        'PASAPORTE',
        'SIN_DOCUMENTO'
    ) NOT NULL,

    numero_documento VARCHAR(20) NULL,

    nombres VARCHAR(80) NULL,
    apellidos VARCHAR(80) NULL,
    razon_social VARCHAR(150) NULL,

    email VARCHAR(120) NULL,
    password_hash VARCHAR(255) NULL,

    telefono VARCHAR(20) NULL,
    direccion VARCHAR(200) NULL,

    estado ENUM(
        'ACTIVO',
        'INACTIVO',
        'BLOQUEADO'
    ) NOT NULL DEFAULT 'ACTIVO',

    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NULL
        DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_cliente
        PRIMARY KEY (id_cliente),

    CONSTRAINT uq_cliente_documento
        UNIQUE (numero_documento),

    CONSTRAINT uq_cliente_email
        UNIQUE (email)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 2. TB_USUARIO
-- Personal administrativo / cajeros
-- ============================================================

CREATE TABLE TB_USUARIO (
    id_usuario INT UNSIGNED AUTO_INCREMENT,

    nombre VARCHAR(100) NOT NULL,

    email VARCHAR(120) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    rol ENUM(
        'ADMIN',
        'CAJERO'
    ) NOT NULL,

    estado ENUM(
        'ACTIVO',
        'INACTIVO',
        'BLOQUEADO'
    ) NOT NULL DEFAULT 'ACTIVO',

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NULL
        DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario
        PRIMARY KEY (id_usuario),

    CONSTRAINT uq_usuario_email
        UNIQUE (email)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 3. TB_CATEGORIA
-- ============================================================

CREATE TABLE TB_CATEGORIA (
    id_categoria INT UNSIGNED AUTO_INCREMENT,

    nombre VARCHAR(80) NOT NULL,

    descripcion VARCHAR(255) NULL,

    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) NOT NULL DEFAULT 'ACTIVO',

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NULL
        DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_categoria
        PRIMARY KEY (id_categoria),

    CONSTRAINT uq_categoria_nombre
        UNIQUE (nombre)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 4. TB_PRODUCTO
-- ============================================================

CREATE TABLE TB_PRODUCTO (
    id_producto INT UNSIGNED AUTO_INCREMENT,

    categoria_id INT UNSIGNED NOT NULL,

    codigo VARCHAR(30) NOT NULL,

    nombre VARCHAR(150) NOT NULL,

    descripcion VARCHAR(500) NULL,

    unidad_medida ENUM(
        'UNIDAD',
        'METRO',
        'ROLLO',
        'CAJA'
    ) NOT NULL DEFAULT 'UNIDAD',

    precio DECIMAL(12,2) NOT NULL,

    stock_disponible DECIMAL(12,2)
        NOT NULL DEFAULT 0,

    stock_reservado DECIMAL(12,2)
        NOT NULL DEFAULT 0,

    stock_minimo DECIMAL(12,2)
        NOT NULL DEFAULT 0,

    imagen_url VARCHAR(255) NULL,

    visible_web BOOLEAN
        NOT NULL DEFAULT TRUE,

    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) NOT NULL DEFAULT 'ACTIVO',

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NULL
        DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_producto
        PRIMARY KEY (id_producto),

    CONSTRAINT uq_producto_codigo
        UNIQUE (codigo),

    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES TB_CATEGORIA(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_producto_precio
        CHECK (precio >= 0),

    CONSTRAINT chk_producto_stock_disponible
        CHECK (stock_disponible >= 0),

    CONSTRAINT chk_producto_stock_reservado
        CHECK (stock_reservado >= 0),

    CONSTRAINT chk_producto_stock_minimo
        CHECK (stock_minimo >= 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 5. TB_CARRITO
-- Carrito persistente del cliente web
-- ============================================================

CREATE TABLE TB_CARRITO (
    id_carrito INT UNSIGNED AUTO_INCREMENT,

    cliente_id INT UNSIGNED NOT NULL,

    estado ENUM(
        'ACTIVO',
        'CONVERTIDO',
        'ABANDONADO'
    ) NOT NULL DEFAULT 'ACTIVO',

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NULL
        DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_carrito
        PRIMARY KEY (id_carrito),

    CONSTRAINT fk_carrito_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES TB_CLIENTE(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 6. TB_DETALLE_CARRITO
-- ============================================================

CREATE TABLE TB_DETALLE_CARRITO (
    id_detalle_carrito INT UNSIGNED AUTO_INCREMENT,

    carrito_id INT UNSIGNED NOT NULL,

    producto_id INT UNSIGNED NOT NULL,

    cantidad DECIMAL(12,2) NOT NULL,

    fecha_agregado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_detalle_carrito
        PRIMARY KEY (id_detalle_carrito),

    CONSTRAINT uq_carrito_producto
        UNIQUE (carrito_id, producto_id),

    CONSTRAINT fk_detalle_carrito_carrito
        FOREIGN KEY (carrito_id)
        REFERENCES TB_CARRITO(id_carrito)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_carrito_producto
        FOREIGN KEY (producto_id)
        REFERENCES TB_PRODUCTO(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_carrito_cantidad
        CHECK (cantidad > 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 7. TB_VENTA
-- Venta WEB o presencial
-- ============================================================

CREATE TABLE TB_VENTA (
    id_venta INT UNSIGNED AUTO_INCREMENT,

    codigo_venta VARCHAR(25) NOT NULL,

    cliente_id INT UNSIGNED NULL,

    usuario_id INT UNSIGNED NULL,

    canal_venta ENUM(
        'WEB',
        'TIENDA'
    ) NOT NULL,

    estado ENUM(
        'PENDIENTE_PAGO',
        'PAGADA',
        'EN_PREPARACION',
        'LISTA_PARA_RECOGER',
        'ENTREGADA',
        'ANULADA'
    ) NOT NULL,

    subtotal DECIMAL(12,2) NOT NULL,

    igv DECIMAL(12,2) NOT NULL,

    total DECIMAL(12,2) NOT NULL,

    observacion VARCHAR(255) NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NULL
        DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_venta
        PRIMARY KEY (id_venta),

    CONSTRAINT uq_venta_codigo
        UNIQUE (codigo_venta),

    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES TB_CLIENTE(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_venta_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES TB_USUARIO(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_venta_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_venta_igv
        CHECK (igv >= 0),

    CONSTRAINT chk_venta_total
        CHECK (total >= 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 8. TB_DETALLE_VENTA
-- ============================================================

CREATE TABLE TB_DETALLE_VENTA (
    id_detalle_venta INT UNSIGNED AUTO_INCREMENT,

    venta_id INT UNSIGNED NOT NULL,

    producto_id INT UNSIGNED NOT NULL,

    producto_nombre VARCHAR(150) NOT NULL,

    unidad_medida VARCHAR(20) NOT NULL,

    precio_unitario DECIMAL(12,2) NOT NULL,

    cantidad DECIMAL(12,2) NOT NULL,

    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT pk_detalle_venta
        PRIMARY KEY (id_detalle_venta),

    CONSTRAINT fk_detalle_venta_venta
        FOREIGN KEY (venta_id)
        REFERENCES TB_VENTA(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_venta_producto
        FOREIGN KEY (producto_id)
        REFERENCES TB_PRODUCTO(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_venta_precio
        CHECK (precio_unitario >= 0),

    CONSTRAINT chk_detalle_venta_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_detalle_venta_subtotal
        CHECK (subtotal >= 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 9. TB_PAGO
-- ============================================================

CREATE TABLE TB_PAGO (
    id_pago INT UNSIGNED AUTO_INCREMENT,

    venta_id INT UNSIGNED NOT NULL,

    metodo_pago ENUM(
        'EFECTIVO',
        'TARJETA',
        'YAPE',
        'PLIN',
        'TRANSFERENCIA'
    ) NOT NULL,

    monto DECIMAL(12,2) NOT NULL,

    estado_pago ENUM(
        'PENDIENTE',
        'APROBADO',
        'RECHAZADO',
        'ANULADO',
        'REEMBOLSADO'
    ) NOT NULL DEFAULT 'PENDIENTE',

    referencia_transaccion VARCHAR(100) NULL,

    fecha_pago DATETIME NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_pago
        PRIMARY KEY (id_pago),

    CONSTRAINT fk_pago_venta
        FOREIGN KEY (venta_id)
        REFERENCES TB_VENTA(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_pago_monto
        CHECK (monto > 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 10. TB_COMPROBANTE
-- ============================================================

CREATE TABLE TB_COMPROBANTE (
    id_comprobante INT UNSIGNED AUTO_INCREMENT,

    venta_id INT UNSIGNED NOT NULL,

    tipo_comprobante ENUM(
        'BOLETA',
        'FACTURA',
        'NOTA_VENTA',
        'PROFORMA'
    ) NOT NULL,

    serie VARCHAR(10) NOT NULL,

    numero VARCHAR(20) NOT NULL,

    tipo_documento_cliente ENUM(
        'DNI',
        'RUC',
        'CE',
        'PASAPORTE',
        'SIN_DOCUMENTO'
    ) NULL,

    documento_cliente VARCHAR(20) NULL,

    nombre_cliente VARCHAR(150) NULL,

    direccion_cliente VARCHAR(200) NULL,

    subtotal DECIMAL(12,2) NOT NULL,

    igv DECIMAL(12,2) NOT NULL,

    total DECIMAL(12,2) NOT NULL,

    estado ENUM(
        'EMITIDO',
        'ANULADO'
    ) NOT NULL DEFAULT 'EMITIDO',

    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_comprobante
        PRIMARY KEY (id_comprobante),

    CONSTRAINT uq_comprobante_serie_numero
        UNIQUE (serie, numero),

    CONSTRAINT fk_comprobante_venta
        FOREIGN KEY (venta_id)
        REFERENCES TB_VENTA(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_comprobante_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_comprobante_igv
        CHECK (igv >= 0),

    CONSTRAINT chk_comprobante_total
        CHECK (total >= 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 11. TB_HISTORIAL_ESTADO_VENTA
-- ============================================================

CREATE TABLE TB_HISTORIAL_ESTADO_VENTA (
    id_historial INT UNSIGNED AUTO_INCREMENT,

    venta_id INT UNSIGNED NOT NULL,

    usuario_id INT UNSIGNED NULL,

    cliente_id INT UNSIGNED NULL,

    tipo_actor ENUM(
        'USUARIO',
        'CLIENTE',
        'SISTEMA'
    ) NOT NULL,

    estado_anterior ENUM(
        'PENDIENTE_PAGO',
        'PAGADA',
        'EN_PREPARACION',
        'LISTA_PARA_RECOGER',
        'ENTREGADA',
        'ANULADA'
    ) NULL,

    estado_nuevo ENUM(
        'PENDIENTE_PAGO',
        'PAGADA',
        'EN_PREPARACION',
        'LISTA_PARA_RECOGER',
        'ENTREGADA',
        'ANULADA'
    ) NOT NULL,

    observacion VARCHAR(255) NULL,

    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_historial_estado
        PRIMARY KEY (id_historial),

    CONSTRAINT fk_historial_venta
        FOREIGN KEY (venta_id)
        REFERENCES TB_VENTA(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES TB_USUARIO(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES TB_CLIENTE(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 12. TB_MOVIMIENTO_STOCK
-- ============================================================

CREATE TABLE TB_MOVIMIENTO_STOCK (
    id_movimiento INT UNSIGNED AUTO_INCREMENT,

    producto_id INT UNSIGNED NOT NULL,

    venta_id INT UNSIGNED NULL,

    usuario_id INT UNSIGNED NULL,

    tipo_movimiento ENUM(
        'ENTRADA',
        'VENTA_TIENDA',
        'RESERVA_WEB',
        'LIBERACION_RESERVA',
        'ENTREGA_WEB',
        'AJUSTE',
        'DEVOLUCION'
    ) NOT NULL,

    cantidad DECIMAL(12,2) NOT NULL,

    stock_disponible_anterior DECIMAL(12,2) NOT NULL,

    stock_disponible_nuevo DECIMAL(12,2) NOT NULL,

    stock_reservado_anterior DECIMAL(12,2) NOT NULL,

    stock_reservado_nuevo DECIMAL(12,2) NOT NULL,

    motivo VARCHAR(255) NULL,

    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_movimiento_stock
        PRIMARY KEY (id_movimiento),

    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (producto_id)
        REFERENCES TB_PRODUCTO(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_venta
        FOREIGN KEY (venta_id)
        REFERENCES TB_VENTA(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES TB_USUARIO(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_movimiento_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_movimiento_stock_disponible_anterior
        CHECK (stock_disponible_anterior >= 0),

    CONSTRAINT chk_movimiento_stock_disponible_nuevo
        CHECK (stock_disponible_nuevo >= 0),

    CONSTRAINT chk_movimiento_stock_reservado_anterior
        CHECK (stock_reservado_anterior >= 0),

    CONSTRAINT chk_movimiento_stock_reservado_nuevo
        CHECK (stock_reservado_nuevo >= 0)

) ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- ÍNDICES ADICIONALES
-- ============================================================

CREATE INDEX idx_producto_categoria
ON TB_PRODUCTO(categoria_id);

CREATE INDEX idx_producto_nombre
ON TB_PRODUCTO(nombre);

CREATE INDEX idx_venta_cliente
ON TB_VENTA(cliente_id);

CREATE INDEX idx_venta_usuario
ON TB_VENTA(usuario_id);

CREATE INDEX idx_venta_canal
ON TB_VENTA(canal_venta);

CREATE INDEX idx_venta_estado
ON TB_VENTA(estado);

CREATE INDEX idx_venta_fecha
ON TB_VENTA(fecha_creacion);

CREATE INDEX idx_detalle_venta_venta
ON TB_DETALLE_VENTA(venta_id);

CREATE INDEX idx_detalle_venta_producto
ON TB_DETALLE_VENTA(producto_id);

CREATE INDEX idx_pago_venta
ON TB_PAGO(venta_id);

CREATE INDEX idx_historial_venta
ON TB_HISTORIAL_ESTADO_VENTA(venta_id);

CREATE INDEX idx_movimiento_producto
ON TB_MOVIMIENTO_STOCK(producto_id);

CREATE INDEX idx_movimiento_fecha
ON TB_MOVIMIENTO_STOCK(fecha_movimiento);

-- CAMBIOS EN TABLAS

ALTER TABLE TB_CARRITO
ADD COLUMN venta_id INT UNSIGNED NULL AFTER cliente_id,
ADD CONSTRAINT uq_carrito_venta
    UNIQUE (venta_id),
ADD CONSTRAINT fk_carrito_venta
    FOREIGN KEY (venta_id)
    REFERENCES TB_VENTA(id_venta)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
    
ALTER TABLE TB_PAGO
ADD COLUMN referencia_reembolso VARCHAR(100) NULL
    AFTER referencia_transaccion,

ADD COLUMN fecha_reembolso DATETIME NULL
    AFTER fecha_pago,

ADD COLUMN motivo_reembolso VARCHAR(255) NULL
    AFTER fecha_reembolso;
    
ALTER TABLE TB_COMPROBANTE
ADD COLUMN usuario_id INT UNSIGNED NULL
AFTER venta_id,

ADD CONSTRAINT fk_comprobante_usuario
FOREIGN KEY (usuario_id)
REFERENCES TB_USUARIO(id_usuario)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE TB_COMPROBANTE
ADD COLUMN usuario_anulacion_id INT UNSIGNED NULL
    AFTER usuario_id,

ADD COLUMN fecha_anulacion DATETIME NULL
    AFTER fecha_emision,

ADD COLUMN motivo_anulacion VARCHAR(255) NULL
    AFTER fecha_anulacion,

ADD CONSTRAINT fk_comprobante_usuario_anulacion
FOREIGN KEY (usuario_anulacion_id)
REFERENCES TB_USUARIO(id_usuario)
ON UPDATE CASCADE
ON DELETE RESTRICT;


-- SE AGREGO LA TABLA PROFORMA DEL MODELO ORIGINAL

CREATE TABLE TB_PROFORMA (

    id_proforma INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    serie VARCHAR(10)
        NOT NULL
        DEFAULT 'P001',

    numero VARCHAR(20)
        NOT NULL,

    cliente_id INT UNSIGNED
        NOT NULL,

    usuario_id INT UNSIGNED
        NOT NULL,

    subtotal DECIMAL(12,2)
        NOT NULL,

    igv DECIMAL(12,2)
        NOT NULL,

    total DECIMAL(12,2)
        NOT NULL,

    fecha_vencimiento DATE
        NOT NULL,

    estado ENUM(
        'VIGENTE',
        'VENCIDA',
        'ANULADA'
    )
        NOT NULL
        DEFAULT 'VIGENTE',

    observacion VARCHAR(500)
        NULL,

    usuario_anulacion_id INT UNSIGNED
        NULL,

    fecha_anulacion DATETIME
        NULL,

    motivo_anulacion VARCHAR(255)
        NULL,

    fecha_creacion DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_proforma_serie_numero
        UNIQUE (
            serie,
            numero
        ),

    CONSTRAINT fk_proforma_cliente
        FOREIGN KEY (
            cliente_id
        )
        REFERENCES TB_CLIENTE(
            id_cliente
        ),

    CONSTRAINT fk_proforma_usuario
        FOREIGN KEY (
            usuario_id
        )
        REFERENCES TB_USUARIO(
            id_usuario
        ),

    CONSTRAINT fk_proforma_usuario_anulacion
        FOREIGN KEY (
            usuario_anulacion_id
        )
        REFERENCES TB_USUARIO(
            id_usuario
        )

) ENGINE = InnoDB;

-- DETALLE PROFORMA 

CREATE TABLE TB_DETALLE_PROFORMA (

    id_detalle_proforma INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    proforma_id INT UNSIGNED
        NOT NULL,

    producto_id INT UNSIGNED
        NOT NULL,

    producto_nombre VARCHAR(180)
        NOT NULL,

    unidad_medida ENUM(
        'UNIDAD',
        'METRO',
        'ROLLO',
        'CAJA'
    )
        NOT NULL,

    precio_unitario DECIMAL(12,2)
        NOT NULL,

    cantidad DECIMAL(12,2)
        NOT NULL,

    subtotal DECIMAL(12,2)
        NOT NULL,

    CONSTRAINT fk_detalle_proforma
        FOREIGN KEY (
            proforma_id
        )
        REFERENCES TB_PROFORMA(
            id_proforma
        )
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_proforma_producto
        FOREIGN KEY (
            producto_id
        )
        REFERENCES TB_PRODUCTO(
            id_producto
        )

) ENGINE = InnoDB;


-- TABLA DEVOLUCION

CREATE TABLE TB_DEVOLUCION (

    id_devolucion INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    codigo_devolucion VARCHAR(30)
        NOT NULL
        UNIQUE,

    venta_id INT UNSIGNED
        NOT NULL,

    usuario_id INT UNSIGNED
        NOT NULL,

    motivo VARCHAR(500)
        NOT NULL,

    subtotal DECIMAL(12,2)
        NOT NULL,

    igv DECIMAL(12,2)
        NOT NULL,

    total DECIMAL(12,2)
        NOT NULL,

    fecha_creacion DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_devolucion_venta
        FOREIGN KEY (venta_id)
        REFERENCES TB_VENTA(id_venta),

    CONSTRAINT fk_devolucion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES TB_USUARIO(id_usuario)

) ENGINE = InnoDB;

-- TABLA DETALLE DEVOLUCION

CREATE TABLE TB_DETALLE_DEVOLUCION (

    id_detalle_devolucion INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    devolucion_id INT UNSIGNED
        NOT NULL,

    detalle_venta_id INT UNSIGNED
        NOT NULL,

    producto_id INT UNSIGNED
        NOT NULL,

    producto_nombre VARCHAR(180)
        NOT NULL,

    unidad_medida ENUM(
        'UNIDAD',
        'METRO',
        'ROLLO',
        'CAJA'
    )
        NOT NULL,

    precio_unitario DECIMAL(12,2)
        NOT NULL,

    cantidad DECIMAL(12,2)
        NOT NULL,

    subtotal DECIMAL(12,2)
        NOT NULL,

    CONSTRAINT chk_devolucion_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT fk_detalle_devolucion_cabecera
        FOREIGN KEY (devolucion_id)
        REFERENCES TB_DEVOLUCION(id_devolucion),

    CONSTRAINT fk_detalle_devolucion_venta
        FOREIGN KEY (detalle_venta_id)
        REFERENCES TB_DETALLE_VENTA(id_detalle_venta),

    CONSTRAINT fk_detalle_devolucion_producto
        FOREIGN KEY (producto_id)
        REFERENCES TB_PRODUCTO(id_producto)

) ENGINE = InnoDB;

-- TABLA DE CIERRE DE CAJA

CREATE TABLE TB_CAJA_SESION (

    id_caja_sesion INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    usuario_id INT UNSIGNED
        NOT NULL,

    monto_apertura DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,

    fecha_apertura DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    estado ENUM(
        'ABIERTA',
        'CERRADA'
    )
        NOT NULL
        DEFAULT 'ABIERTA',

    fecha_cierre DATETIME
        NULL,

    cantidad_ventas INT UNSIGNED
        NULL,

    total_ventas DECIMAL(12,2)
        NULL,

    total_efectivo DECIMAL(12,2)
        NULL,

    total_tarjeta DECIMAL(12,2)
        NULL,

    total_yape DECIMAL(12,2)
        NULL,

    total_plin DECIMAL(12,2)
        NULL,

    total_transferencia DECIMAL(12,2)
        NULL,

    efectivo_esperado DECIMAL(12,2)
        NULL,

    efectivo_declarado DECIMAL(12,2)
        NULL,

    diferencia DECIMAL(12,2)
        NULL,

    observacion_cierre VARCHAR(500)
        NULL,

    CONSTRAINT fk_caja_sesion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES TB_USUARIO(id_usuario),

    INDEX idx_caja_usuario_estado (
        usuario_id,
        estado
    ),

    INDEX idx_caja_fecha_apertura (
        fecha_apertura
    )

) ENGINE = InnoDB;

-- MODIFICACIONES A LAS TABLAS PRODUCTO

ALTER TABLE TB_PRODUCTO
ADD COLUMN codigo_barras VARCHAR(100) NULL
AFTER codigo;

ALTER TABLE TB_PRODUCTO
ADD CONSTRAINT uk_producto_codigo_barras
UNIQUE (codigo_barras);

