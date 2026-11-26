# language: es
@sprint3
Característica: Confirmación y consulta de pedidos web

  Como cliente de AgroInPerú
  Quiero confirmar mi carrito de compras
  Para generar una venta web y reservar los productos solicitados

  Escenario: Confirmación exitosa de una venta web
    Dado que existe un cliente válido con un carrito activo
    Y el carrito contiene un producto activo con stock disponible
    Cuando el cliente confirma su venta web
    Entonces la venta se registra correctamente
    Y la venta queda en estado "PENDIENTE_PAGO"
    Y el canal de venta es "WEB"
    Y el stock del producto queda reservado
    Y la transacción es confirmada

  Escenario: Rechazo de venta cuando el carrito está vacío
    Dado que existe un cliente válido con un carrito activo vacío
    Cuando el cliente confirma su venta web
    Entonces la venta web es rechazada con el error "CARRITO_VACIO"
    Y la transacción es revertida

  Escenario: Rechazo de venta por stock insuficiente
    Dado que existe un cliente válido con un carrito activo
    Y el carrito solicita una cantidad superior al stock disponible
    Cuando el cliente confirma su venta web
    Entonces el sistema rechaza la operación por stock insuficiente
    Y la transacción es revertida

  Escenario: Consulta de pedidos pertenecientes al cliente
    Dado que existe un cliente válido con pedidos web registrados
    Cuando el cliente consulta sus pedidos
    Entonces el sistema devuelve únicamente sus pedidos web