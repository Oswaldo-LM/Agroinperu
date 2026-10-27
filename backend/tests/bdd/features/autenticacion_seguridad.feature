# language: es
Característica: Autenticación y control de acceso seguro
  Como usuario del sistema AgroInPerú
  Quiero iniciar sesión con mi correo electrónico y contraseña
  Para acceder de forma segura a las funciones de la plataforma

  Escenario: Inicio de sesión exitoso de un cliente activo
    Dado que existe un cliente registrado con email "juan.perez@agroinperu.pe" y estado "ACTIVO"
    Y su contraseña almacenada es "ClaveSegura123"
    Cuando el cliente intenta iniciar sesión con email "juan.perez@agroinperu.pe" y contraseña "ClaveSegura123"
    Entonces el sistema autoriza el acceso
    Y el sistema genera un token de autenticación JWT

  Escenario: Bloqueo de inicio de sesión para cliente con cuenta inactiva
    Dado que existe un cliente registrado con email "cliente.inactivo@agroinperu.pe" y estado "INACTIVO"
    Y su contraseña almacenada es "ClaveSegura123"
    Cuando el cliente intenta iniciar sesión con email "cliente.inactivo@agroinperu.pe" y contraseña "ClaveSegura123"
    Entonces el sistema deniega el acceso con el error "CUENTA_NO_DISPONIBLE"

  Escenario: Rechazo de credenciales por contraseña incorrecta
    Dado que existe un cliente registrado con email "juan.perez@agroinperu.pe" y estado "ACTIVO"
    Y su contraseña almacenada es "ClaveSegura123"
    Cuando el cliente intenta iniciar sesión con email "juan.perez@agroinperu.pe" y contraseña "ClaveErronea999"
    Entonces el sistema deniega el acceso con el error "CREDENCIALES_INVALIDAS"
