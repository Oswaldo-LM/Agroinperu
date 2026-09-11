import bcrypt from 'bcrypt';

import {
  ActualizarClienteDto,
  Cliente,
  CrearClienteDto,
  EstadoCliente,
  RegistrarClienteWebDto,
  TipoCliente,
  TipoDocumento
} from '../models/cliente.model';

import {
  ClienteRepository
} from '../repositories/cliente.repository';


export class ClienteService {

  private clienteRepository =
    new ClienteRepository();


  async listar(): Promise<Cliente[]> {

    return this.clienteRepository
      .obtenerTodos();
  }


  async obtenerPorId(
    id: number
  ): Promise<Cliente> {

    this.validarId(id);

    const cliente =
      await this.clienteRepository
        .obtenerPorId(id);

    if (!cliente) {
      throw new Error(
        'CLIENTE_NO_ENCONTRADO'
      );
    }

    return cliente;
  }


  /*
  |--------------------------------------------------------------------------
  | Registro WEB
  |--------------------------------------------------------------------------
  */

  async registrarWeb(
    datos: RegistrarClienteWebDto
  ): Promise<Cliente> {

    const datosValidados =
      await this.validarDatosCliente(
        datos
      );

    const email =
      this.validarEmailObligatorio(
        datos.email
      );

    this.validarPassword(
      datos.password
    );

    const clienteEmail =
      await this.clienteRepository
        .obtenerPorEmail(email);

    if (clienteEmail) {
      throw new Error(
        'EMAIL_DUPLICADO'
      );
    }

    await this.validarDocumentoDuplicado(
      datosValidados.numero_documento
    );

    const passwordHash =
      await bcrypt.hash(
        datos.password,
        12
      );

    return this.clienteRepository.crear(
      {
        ...datosValidados,
        email
      },
      passwordHash
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Registro desde administración/caja
  |--------------------------------------------------------------------------
  */

  async crear(
    datos: CrearClienteDto
  ): Promise<Cliente> {

    const datosValidados =
      await this.validarDatosCliente(
        datos
      );

    let email: string | null = null;

    if (datos.email) {

      email =
        this.validarEmail(datos.email);

      const existente =
        await this.clienteRepository
          .obtenerPorEmail(email);

      if (existente) {
        throw new Error(
          'EMAIL_DUPLICADO'
        );
      }
    }

    await this.validarDocumentoDuplicado(
      datosValidados.numero_documento
    );

    return this.clienteRepository.crear(
      {
        ...datosValidados,
        email
      }
    );
  }


  async actualizar(
    id: number,
    datos: ActualizarClienteDto
  ): Promise<Cliente> {

    this.validarId(id);

    const cliente =
      await this.clienteRepository
        .obtenerPorId(id);

    if (!cliente) {
      throw new Error(
        'CLIENTE_NO_ENCONTRADO'
      );
    }

    const datosValidados =
      await this.validarDatosCliente(
        datos
      );

    let email: string | null = null;

    if (datos.email) {

      email =
        this.validarEmail(
          datos.email
        );

      const existente =
        await this.clienteRepository
          .obtenerPorEmail(
            email,
            id
          );

      if (existente) {
        throw new Error(
          'EMAIL_DUPLICADO'
        );
      }
    }

    if (
      datosValidados.numero_documento
    ) {

      const existente =
        await this.clienteRepository
          .obtenerPorDocumento(
            datosValidados.numero_documento,
            id
          );

      if (existente) {
        throw new Error(
          'DOCUMENTO_DUPLICADO'
        );
      }
    }

    this.validarEstado(
      datos.estado
    );

    const actualizado =
      await this.clienteRepository
        .actualizar(
          id,
          {
            ...datosValidados,
            email,
            estado:
              datos.estado
          }
        );

    if (!actualizado) {
      throw new Error(
        'ERROR_ACTUALIZAR_CLIENTE'
      );
    }

    return actualizado;
  }


  async desactivar(
    id: number
  ): Promise<void> {

    this.validarId(id);

    const cliente =
      await this.clienteRepository
        .obtenerPorId(id);

    if (!cliente) {
      throw new Error(
        'CLIENTE_NO_ENCONTRADO'
      );
    }

    if (
      cliente.estado ===
      'INACTIVO'
    ) {
      throw new Error(
        'CLIENTE_YA_INACTIVO'
      );
    }

    await this.clienteRepository
      .desactivar(id);
  }


  /*
  |--------------------------------------------------------------------------
  | Validaciones
  |--------------------------------------------------------------------------
  */

  private async validarDatosCliente(
    datos:
      | CrearClienteDto
      | RegistrarClienteWebDto
      | ActualizarClienteDto
  ): Promise<CrearClienteDto> {

    this.validarTipoCliente(
      datos.tipo_cliente
    );

    this.validarTipoDocumento(
      datos.tipo_documento
    );

    let numeroDocumento =
      datos.numero_documento
        ?.trim() || null;


    if (
      datos.tipo_documento ===
      'SIN_DOCUMENTO'
    ) {

      numeroDocumento = null;

    } else {

      if (!numeroDocumento) {
        throw new Error(
          'DOCUMENTO_OBLIGATORIO'
        );
      }

      this.validarFormatoDocumento(
        datos.tipo_documento,
        numeroDocumento
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Persona
    |--------------------------------------------------------------------------
    */

    let nombres: string | null = null;
    let apellidos: string | null = null;
    let razonSocial: string | null = null;


    if (
      datos.tipo_cliente ===
      'PERSONA'
    ) {

      nombres =
        datos.nombres?.trim() || null;

      apellidos =
        datos.apellidos?.trim() || null;

      if (!nombres) {
        throw new Error(
          'NOMBRES_OBLIGATORIOS'
        );
      }

      if (!apellidos) {
        throw new Error(
          'APELLIDOS_OBLIGATORIOS'
        );
      }

    } else {

      razonSocial =
        datos.razon_social
          ?.trim() || null;

      if (!razonSocial) {
        throw new Error(
          'RAZON_SOCIAL_OBLIGATORIA'
        );
      }

      if (
        datos.tipo_documento !==
        'RUC'
      ) {
        throw new Error(
          'EMPRESA_REQUIERE_RUC'
        );
      }
    }


    if (
      nombres &&
      nombres.length > 80
    ) {
      throw new Error(
        'NOMBRES_MUY_LARGOS'
      );
    }

    if (
      apellidos &&
      apellidos.length > 80
    ) {
      throw new Error(
        'APELLIDOS_MUY_LARGOS'
      );
    }

    if (
      razonSocial &&
      razonSocial.length > 150
    ) {
      throw new Error(
        'RAZON_SOCIAL_MUY_LARGA'
      );
    }


    const telefono =
      datos.telefono?.trim() || null;

    if (
      telefono &&
      telefono.length > 20
    ) {
      throw new Error(
        'TELEFONO_MUY_LARGO'
      );
    }


    const direccion =
      datos.direccion?.trim() || null;

    if (
      direccion &&
      direccion.length > 200
    ) {
      throw new Error(
        'DIRECCION_MUY_LARGA'
      );
    }


    return {
      tipo_cliente:
        datos.tipo_cliente,

      tipo_documento:
        datos.tipo_documento,

      numero_documento:
        numeroDocumento,

      nombres,

      apellidos,

      razon_social:
        razonSocial,

      telefono,

      direccion
    };
  }


  private validarTipoCliente(
    tipo: TipoCliente
  ): void {

    const tipos: TipoCliente[] = [
      'PERSONA',
      'EMPRESA'
    ];

    if (!tipos.includes(tipo)) {
      throw new Error(
        'TIPO_CLIENTE_INVALIDO'
      );
    }
  }


  private validarTipoDocumento(
    tipo: TipoDocumento
  ): void {

    const tipos: TipoDocumento[] = [
      'DNI',
      'RUC',
      'CE',
      'PASAPORTE',
      'SIN_DOCUMENTO'
    ];

    if (!tipos.includes(tipo)) {
      throw new Error(
        'TIPO_DOCUMENTO_INVALIDO'
      );
    }
  }


  private validarFormatoDocumento(
    tipo: TipoDocumento,
    documento: string
  ): void {

    switch (tipo) {

      case 'DNI':

        if (!/^\d{8}$/.test(documento)) {
          throw new Error(
            'DNI_INVALIDO'
          );
        }

        break;


      case 'RUC':

        if (!/^\d{11}$/.test(documento)) {
          throw new Error(
            'RUC_INVALIDO'
          );
        }

        break;


      case 'CE':
      case 'PASAPORTE':

        if (
          documento.length < 3 ||
          documento.length > 20
        ) {
          throw new Error(
            'DOCUMENTO_INVALIDO'
          );
        }

        break;
    }
  }


  private validarEmail(
    email: string
  ): string {

    const valor =
      email.trim().toLowerCase();

    if (valor.length > 120) {
      throw new Error(
        'EMAIL_MUY_LARGO'
      );
    }

    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(valor)) {
      throw new Error(
        'EMAIL_INVALIDO'
      );
    }

    return valor;
  }


  private validarEmailObligatorio(
    email: string
  ): string {

    if (!email?.trim()) {
      throw new Error(
        'EMAIL_OBLIGATORIO'
      );
    }

    return this.validarEmail(email);
  }


  private validarPassword(
    password: string
  ): void {

    if (!password) {
      throw new Error(
        'PASSWORD_OBLIGATORIO'
      );
    }

    if (password.length < 8) {
      throw new Error(
        'PASSWORD_MUY_CORTO'
      );
    }

    if (password.length > 72) {
      throw new Error(
        'PASSWORD_MUY_LARGO'
      );
    }
  }


  private async validarDocumentoDuplicado(
    documento: string | null | undefined
  ): Promise<void> {

    if (!documento) {
      return;
    }

    const existente =
      await this.clienteRepository
        .obtenerPorDocumento(
          documento
        );

    if (existente) {
      throw new Error(
        'DOCUMENTO_DUPLICADO'
      );
    }
  }


  private validarEstado(
    estado: EstadoCliente
  ): void {

    const estados:
      EstadoCliente[] = [
        'ACTIVO',
        'INACTIVO',
        'BLOQUEADO'
      ];

    if (!estados.includes(estado)) {
      throw new Error(
        'ESTADO_INVALIDO'
      );
    }
  }


  private validarId(
    id: number
  ): void {

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        'ID_INVALIDO'
      );
    }
  }
}