# language: es
Característica: Gestión y reactivación de categorías del catálogo
  Como administrador del sistema AgroInPerú
  Quiero reactivar categorías que fueron previamente inactivadas
  Para que los productos asociados vuelvan a estar disponibles en la tienda

  Escenario: Reactivación exitosa de una categoría inactiva
    Dado que existe en el catálogo una categoría inactiva con ID 10 y nombre "Sistemas de Riego"
    Cuando el administrador solicita activar la categoría con ID 10
    Entonces el sistema confirma la reactivación exitosa
    Y la categoría queda en estado "ACTIVO"

  Escenario: Rechazo de reactivación si la categoría ya está activa
    Dado que existe en el catálogo una categoría activa con ID 20 y nombre "Fertilizantes Orgánicos"
    Cuando el administrador solicita activar la categoría con ID 20
    Entonces el sistema rechaza la operación con el error "CATEGORIA_YA_ACTIVA"
