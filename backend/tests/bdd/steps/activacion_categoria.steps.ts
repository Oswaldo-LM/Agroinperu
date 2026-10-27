import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import { CategoriaService } from '../../../src/services/categoria.service';
import { Categoria } from '../../../src/models/categoria.model';

let service: CategoriaService;
let categoriaActual: Categoria | null = null;
let errorLanzado: Error | null = null;
let resultadoExitoso = false;

const categoriasEnMemoria = new Map<number, Categoria>();

Before(function () {
  service = new CategoriaService();
  categoriasEnMemoria.clear();
  errorLanzado = null;
  resultadoExitoso = false;
  categoriaActual = null;

  const mockRepo = {
    obtenerPorId: async (id: number) => categoriasEnMemoria.get(id) || null,
    activar: async (id: number) => {
      const cat = categoriasEnMemoria.get(id);
      if (cat) {
        cat.estado = 'ACTIVO';
        return true;
      }
      return false;
    }
  };

  (service as any).categoriaRepository = mockRepo;
});

Given('que existe en el catálogo una categoría inactiva con ID {int} y nombre {string}', function (id: number, nombre: string) {
  const cat: Categoria = {
    id_categoria: id,
    nombre,
    descripcion: 'Descripción de prueba BDD',
    estado: 'INACTIVO',
    fecha_creacion: new Date(),
    fecha_actualizacion: null
  };
  categoriasEnMemoria.set(id, cat);
});

Given('que existe en el catálogo una categoría activa con ID {int} y nombre {string}', function (id: number, nombre: string) {
  const cat: Categoria = {
    id_categoria: id,
    nombre,
    descripcion: 'Descripción de prueba BDD activa',
    estado: 'ACTIVO',
    fecha_creacion: new Date(),
    fecha_actualizacion: null
  };
  categoriasEnMemoria.set(id, cat);
});

When('el administrador solicita activar la categoría con ID {int}', async function (id: number) {
  try {
    await service.activar(id);
    resultadoExitoso = true;
    categoriaActual = categoriasEnMemoria.get(id) || null;
  } catch (err: any) {
    errorLanzado = err;
    resultadoExitoso = false;
  }
});

Then('el sistema confirma la reactivación exitosa', function () {
  assert.strictEqual(resultadoExitoso, true);
  assert.strictEqual(errorLanzado, null);
});

Then('la categoría queda en estado {string}', function (estadoEsperado: string) {
  assert.ok(categoriaActual, 'La categoría debe existir');
  assert.strictEqual(categoriaActual.estado, estadoEsperado);
});

Then('el sistema rechaza la operación con el error {string}', function (mensajeErrorEsperado: string) {
  assert.ok(errorLanzado, 'Se esperaba un error');
  assert.strictEqual(errorLanzado.message, mensajeErrorEsperado);
});
