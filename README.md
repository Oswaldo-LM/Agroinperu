# Sistema de Gestión de Ventas - AGROINPERU S.A.C.

Sistema web para la gestión de ventas de **AGROINPERU S.A.C.**, orientado al control de productos, inventario, clientes, ventas presenciales, ventas web, pagos, pedidos, caja, comprobantes, proformas, devoluciones y reportes.

El sistema cuenta con un portal público para clientes y un módulo administrativo para el personal de la empresa.

---

## Tecnologías utilizadas

### Frontend

- Angular
- TypeScript
- HTML5
- CSS3
- Bootstrap

### Backend

- Node.js
- Express.js
- TypeScript
- JWT
- bcrypt

### Base de datos

- MySQL

### Herramientas

- Git
- GitHub
- Postman
- npm

---

## Arquitectura

El backend utiliza una arquitectura por capas:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MySQL
```

La aplicación está dividida en dos áreas principales:

```text
Frontend Angular
│
├── Portal público / Cliente
│
└── Panel administrativo
        │
        ├── ADMIN
        └── CAJERO
```

---

## Funcionalidades principales

### Portal público

- Página de inicio.
- Catálogo de productos.
- Registro de clientes.
- Inicio de sesión de clientes.
- Carrito de compras.
- Confirmación de pedidos web.
- Registro de pago.
- Consulta de pedidos.
- Consulta del estado del pedido.
- Consulta del historial de pagos.
- Cuenta del cliente.

### Panel administrativo

- Dashboard.
- Gestión de clientes.
- Gestión de categorías.
- Gestión de productos.
- Código de barras de productos.
- Control de inventario.
- Movimientos de stock.
- Venta presencial.
- Gestión de pedidos web.
- Aprobación y rechazo de pagos.
- Control de estados de pedidos.
- Caja.
- Comprobantes.
- Proformas.
- Devoluciones.
- Gestión de usuarios.
- Reportes.
- Exportación de reportes a CSV.

---

## Roles

El sistema maneja tres tipos principales de cuenta.

### Cliente

Puede:

- Registrarse.
- Iniciar sesión.
- Consultar el catálogo.
- Utilizar el carrito.
- Realizar pedidos.
- Registrar pagos.
- Consultar sus pedidos.
- Consultar el estado de sus pagos.

### Cajero

Puede realizar operaciones relacionadas con atención y ventas, entre ellas:

- Venta presencial.
- Gestión de pedidos web.
- Consulta de clientes.
- Caja.
- Proformas.
- Devoluciones.

### Administrador

Tiene acceso a las funcionalidades administrativas, incluyendo:

- Productos.
- Categorías.
- Inventario.
- Usuarios.
- Reportes.
- Operaciones disponibles para el cajero.

---

# Estructura del proyecto

```text
agroinperu/
│
├── backend/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── layouts/
│   │   │   ├── models/
│   │   │   └── pages/
│   │   │
│   │   └── environments/
│   │
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   └── scripts SQL
│
├── .gitignore
└── README.md
```

---

# Requisitos previos

Antes de ejecutar el proyecto se debe tener instalado:

- Node.js
- npm
- MySQL
- Git
- Angular CLI

Para comprobar las instalaciones:

```bash
node --version
npm --version
git --version
ng version
```

También se recomienda utilizar:

- Visual Studio Code
- MySQL Workbench
- Postman

---

# 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar al proyecto:

```bash
cd agroinperu
```

---

# 2. Configuración de la base de datos

Crear la base de datos MySQL utilizando los scripts ubicados en:

```text
database/
```

Ejecutar primero el script que contiene la estructura de tablas y posteriormente los datos iniciales que sean necesarios.

La base contiene, entre otras, las siguientes tablas:

```text
TB_CLIENTE
TB_USUARIO
TB_CATEGORIA
TB_PRODUCTO
TB_CARRITO
TB_DETALLE_CARRITO
TB_VENTA
TB_DETALLE_VENTA
TB_PAGO
TB_COMPROBANTE
TB_HISTORIAL_ESTADO_VENTA
TB_MOVIMIENTO_STOCK
TB_PROFORMA
TB_DETALLE_PROFORMA
TB_DEVOLUCION
TB_DETALLE_DEVOLUCION
TB_CAJA_SESION
```

---

# 3. Configuración del backend

Entrar en:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo:

```text
backend/.env
```

Se puede utilizar como referencia:

```text
backend/.env.example
```

Ejemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL
DB_NAME=NOMBRE_DE_TU_BASE_DE_DATOS

JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_SEGURA
JWT_EXPIRES_IN=2h

FRONTEND_URL=http://localhost:4200
```

> El archivo `.env` no debe subirse al repositorio.

---

## Ejecutar backend

Modo desarrollo:

```bash
npm run dev
```

El backend estará disponible normalmente en:

```text
http://localhost:3000
```

Para verificar que funciona:

```text
http://localhost:3000/api/health
```

La ruta:

```text
http://localhost:3000/
```

puede responder:

```json
{
  "success": false,
  "message": "Ruta no encontrada"
}
```

Esto es normal si no existe una ruta `GET /`.

---

# 4. Datos de prueba

El backend incluye un script para generar usuarios de prueba.

Desde:

```text
backend/
```

ejecutar:

```bash
npm run seed:pruebas
```

También puede ejecutarse directamente:

```bash
npx tsx src/scripts/seed-pruebas.ts
```

## Credenciales de prueba

### Administrador

```text
Correo:
admin@agroinperu.com

Contraseña:
Admin12345
```

### Cajero

```text
Correo:
cajero@agroinperu.com

Contraseña:
Cajero12345
```

### Cliente

```text
Correo:
cliente@agroinperu.com

Contraseña:
Cliente12345
```

---

# 5. Configuración del frontend

Abrir otra terminal y entrar en:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Verificar que el archivo de entorno apunte al backend.

Ejemplo:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000/api'
};
```

Ejecutar Angular:

```bash
ng serve
```

o:

```bash
npm start
```

según los scripts disponibles en `package.json`.

El frontend estará disponible normalmente en:

```text
http://localhost:4200
```

---

# Ejecución completa

Se necesitan dos terminales.

## Terminal 1 - Backend

```bash
cd backend
npm install
npm run dev
```

## Terminal 2 - Frontend

```bash
cd frontend
npm install
ng serve
```

Después abrir:

```text
http://localhost:4200
```

---

# Flujo de venta web

El proceso principal de compra web es:

```text
Cliente
   ↓
Registro / Login
   ↓
Catálogo
   ↓
Carrito
   ↓
Confirmar compra
   ↓
PENDIENTE_PAGO
   ↓
Registrar pago
   ↓
Administrador / Cajero valida pago
   ↓
PAGADA
   ↓
EN_PREPARACION
   ↓
LISTA_PARA_RECOGER
   ↓
ENTREGADA
```

Al confirmar una venta web, el sistema reserva stock.

El stock reservado se libera si la operación correspondiente es anulada o reembolsada antes de la entrega.

---

# Estados de pedido

Los pedidos web pueden tener los siguientes estados:

```text
PENDIENTE_PAGO
PAGADA
EN_PREPARACION
LISTA_PARA_RECOGER
ENTREGADA
ANULADA
```

---

# Estados de pago

Los pagos pueden tener los siguientes estados:

```text
PENDIENTE
APROBADO
RECHAZADO
ANULADO
REEMBOLSADO
```

Los métodos de pago utilizados por el sistema incluyen:

```text
EFECTIVO
TARJETA
YAPE
PLIN
TRANSFERENCIA
```

Para compras web se utilizan métodos electrónicos permitidos por la lógica del sistema.

---

# Venta presencial

Para realizar una venta presencial:

1. El usuario debe iniciar sesión como personal autorizado.
2. Debe existir una caja abierta.
3. Se seleccionan los productos.
4. También puede utilizarse el código de barras.
5. Se selecciona el método de pago.
6. Se selecciona el tipo de comprobante.
7. El backend valida nuevamente precios y stock.
8. Se registra la venta.
9. Se descuenta el stock.
10. Se registra el movimiento de inventario.

---

# Código de barras

Cada producto puede tener un:

```text
codigo
```

interno y, adicionalmente, un:

```text
codigo_barras
```

El módulo de venta presencial permite utilizar un lector USB de códigos de barras.

Los lectores USB tradicionales funcionan como teclado, por lo que normalmente no necesitan librerías especiales.

Flujo:

```text
Escanear código
      ↓
Buscar producto
      ↓
Agregar cantidad 1
      ↓
Escanear nuevamente
      ↓
Incrementar cantidad
```

Los productos vendidos por `METRO` pueden posteriormente utilizar cantidades decimales.

---

# Inventario

El sistema controla:

```text
stock_disponible
stock_reservado
stock_minimo
```

También registra movimientos de inventario.

Algunos tipos de movimiento utilizados son:

```text
ENTRADA
VENTA_TIENDA
RESERVA_WEB
LIBERACION_RESERVA
ENTREGA_WEB
AJUSTE
DEVOLUCION
```

---

# Caja

Para realizar ventas presenciales debe existir una sesión de caja abierta.

El sistema registra:

- Monto de apertura.
- Fecha de apertura.
- Ventas realizadas.
- Totales por método de pago.
- Efectivo esperado.
- Efectivo declarado.
- Diferencia.
- Fecha de cierre.

El efectivo esperado se calcula con:

```text
monto de apertura
+
ventas en efectivo
```

---

# Proformas

Las proformas se manejan independientemente de una venta.

Una proforma:

- No descuenta stock.
- No reserva stock.
- No genera pagos.
- No genera ventas automáticamente.

Puede ser creada, consultada y anulada según los permisos definidos.

---

# Devoluciones

Las devoluciones se realizan sobre ventas entregadas.

El sistema permite:

- Devoluciones parciales.
- Múltiples devoluciones.
- Validación para evitar devolver más unidades que las vendidas.
- Reposición del stock disponible.
- Registro del movimiento `DEVOLUCION`.

---

# Reportes

El administrador puede consultar reportes de ventas mediante un rango de fechas.

Los reportes incluyen:

- Resumen de ventas.
- Ventas por canal.
- Productos más vendidos.
- Métodos de pago.
- Detalle de ventas.

También existe exportación a:

```text
CSV
```

El rango máximo permitido actualmente es de:

```text
366 días
```

---

# Seguridad

El sistema utiliza:

- JWT para autenticación.
- bcrypt para contraseñas.
- Guards en Angular.
- Middleware de autenticación en Express.
- Validación de roles.
- Validación del propietario de pedidos.
- Validaciones en el backend.
- Transacciones MySQL para operaciones críticas.

El frontend no debe considerarse la fuente de seguridad.

Todas las validaciones críticas se realizan nuevamente en el backend.

---

# Sesiones

El frontend utiliza:

```text
sessionStorage
```

para almacenar el JWT.

Esto permite mantener sesiones independientes en diferentes pestañas.

Ejemplo:

```text
Pestaña 1
CLIENTE

Pestaña 2
ADMIN
```

De esta forma iniciar sesión como administrador no reemplaza automáticamente la sesión del cliente que está abierta en otra pestaña.

---

# Pruebas

Los endpoints pueden probarse mediante Postman.

Se recomienda verificar como mínimo:

```text
Autenticación
Clientes
Categorías
Productos
Código de barras
Inventario
Carrito
Venta web
Pagos
Pedidos
Venta presencial
Caja
Comprobantes
Proformas
Devoluciones
Reportes
Roles y permisos
Casos negativos
```

Antes de subir cambios se recomienda comprobar:

## Backend

```bash
cd backend
npx tsc --noEmit
```

## Frontend

```bash
cd frontend
npx ng build
```

---

# Trabajo colaborativo con Git

No se recomienda desarrollar directamente sobre `main`.

Primero actualizar:

```bash
git checkout main
git pull origin main
```

Crear una rama:

```bash
git checkout -b feature/nombre-funcionalidad
```

Ejemplos:

```bash
git checkout -b feature/imagenes-productos
```

```bash
git checkout -b feature/docker
```

```bash
git checkout -b fix/correccion-pedidos
```

Después de trabajar:

```bash
git status
git add .
git commit -m "feat: descripcion del cambio"
git push -u origin feature/nombre-funcionalidad
```

Finalmente crear un **Pull Request** hacia:

```text
main
```

---

# Convención recomendada para commits

Ejemplos:

```text
feat: agregar nueva funcionalidad
fix: corregir error
refactor: reorganizar codigo
docs: actualizar documentacion
test: agregar pruebas
chore: configuracion del proyecto
```

Ejemplo:

```bash
git commit -m "feat: agregar gestion de imagenes de productos"
```

---

# Antes de realizar un Pull Request

Comprobar:

```bash
git status
```

Después:

```bash
cd backend
npx tsc --noEmit
```

y:

```bash
cd ../frontend
npx ng build
```

No subir:

```text
node_modules/
.env
dist/
.angular/
```

---

# Variables privadas

Nunca subir al repositorio:

```text
DB_PASSWORD
JWT_SECRET
tokens JWT
credenciales personales
```

Estas variables deben colocarse únicamente en:

```text
.env
```

El repositorio debe contener únicamente:

```text
.env.example
```

con valores de ejemplo.

---

# Funcionalidades pendientes / mejoras

Algunas funcionalidades que pueden implementarse posteriormente son:

- Carga local de imágenes de productos.
- Exportación de reportes a Excel `.xlsx`.
- Docker y Docker Compose.
- NGINX.
- Mejoras visuales y de experiencia de usuario.
- Pruebas automatizadas.

---

# Estado del proyecto

Actualmente se encuentran implementados los principales módulos funcionales:

```text
✅ Autenticación
✅ Roles ADMIN / CAJERO / CLIENTE
✅ Clientes
✅ Categorías
✅ Productos
✅ Código de barras
✅ Inventario
✅ Carrito
✅ Ventas web
✅ Pagos web
✅ Gestión de pedidos
✅ Venta presencial
✅ Comprobantes
✅ Caja
✅ Proformas
✅ Devoluciones
✅ Reportes
✅ Exportación CSV
```

Pendientes opcionales:

```text
⬜ Imágenes de productos
⬜ Exportación Excel
⬜ Docker / Docker Compose
```

---

# AGROINPERU S.A.C.

Proyecto académico de desarrollo de un **Sistema de Gestión de Ventas** para AGROINPERU S.A.C.
