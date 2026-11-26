# language: es
@sprint4

Característica: Gestión funcional de caja
  Como usuario interno del sistema
  Quiero abrir, consultar y cerrar mi caja
  Para controlar correctamente el efectivo de mi turno

  Escenario: Apertura correcta de caja
    Dado que el usuario de caja tiene el identificador 3
    Y no existe una caja abierta para el usuario
    Cuando el usuario abre la caja con un monto de 100
    Entonces la apertura de caja es registrada correctamente
    Y la caja queda en estado "ABIERTA"

  Escenario: Rechazar una segunda apertura de caja
    Dado que el usuario de caja tiene el identificador 3
    Y ya existe una caja abierta para el usuario
    Cuando el usuario intenta abrir otra caja con un monto de 100
    Entonces la operación de caja es rechazada con el error "CAJA_YA_ABIERTA"

  Escenario: Consultar el estado actual de la caja
    Dado que el usuario de caja tiene el identificador 3
    Y existe una caja abierta con monto de apertura de 100
    Y durante el turno se registraron 50 soles en efectivo
    Cuando el usuario consulta su caja actual
    Entonces el efectivo esperado de la caja es 150

  Escenario: Cierre correcto de caja sin diferencia
    Dado que el usuario de caja tiene el identificador 3
    Y existe una caja abierta con monto de apertura de 100
    Y durante el turno se registraron 50 soles en efectivo
    Cuando el usuario cierra la caja declarando 150 soles
    Entonces la caja queda en estado "CERRADA"
    Y la diferencia de caja es 0

  Escenario: Detectar sobrante durante el cierre de caja
    Dado que el usuario de caja tiene el identificador 3
    Y existe una caja abierta con monto de apertura de 100
    Y durante el turno se registraron 50 soles en efectivo
    Cuando el usuario cierra la caja declarando 170 soles
    Entonces el efectivo esperado al cierre es 150
    Y la diferencia de caja es 20