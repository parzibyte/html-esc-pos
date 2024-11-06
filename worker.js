import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const NOMBRE_BASE_DE_DATOS = 'html_designs.sqlite';
let db;
const iniciar = async () => {
  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
  });
  if ('opfs' in sqlite3) {
    db = new sqlite3.oo1.OpfsDb(NOMBRE_BASE_DE_DATOS);
    console.log(
      'OPFS is available, created persisted database at',
      db.filename
    );
  } else {
    db = new sqlite3.oo1.DB(NOMBRE_BASE_DE_DATOS, 'ct');
    console.log(
      'OPFS is not available, created transient database',
      db.filename
    );
  }
  db.exec(`CREATE TABLE IF NOT EXISTS diseños_html(
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				titulo TEXT NOT NULL,
				fecha_creacion TEXT NOT NULL,
				fecha_modificacion TEXT NOT NULL,
				ancho_ticket INTEGER NOT NULL DEFAULT 380,
				ancho_pagina INTEGER NOT NULL DEFAULT 380,
				aplicar_dithering INTEGER NOT NULL DEFAULT 0,
				algoritmo_impresion INTEGER NOT NULL DEFAULT 0,
				contenido TEXT NOT NULL)`);
};

const actualizarDiseño = async (id, contenido, fecha_modificacion, titulo, anchoPagina, anchoTicket, aplicarDithering, algoritmoImpresion) => {
  const filas = await db.exec({
    sql: `UPDATE diseños_html
    SET
    contenido = ?,
    fecha_modificacion = ?,
    titulo = ?,
    ancho_ticket = ?,
    ancho_pagina = ?,
    aplicar_dithering = ?,
    algoritmo_impresion = ?
    WHERE id = ?
    RETURNING *`,
    bind: [contenido, fecha_modificacion, titulo, anchoTicket, anchoPagina, aplicarDithering, algoritmoImpresion, id],
    returnValue: 'resultRows',
    rowMode: 'object',
  });
  return filas[0];
};
const insertarDiseño = async (titulo, contenido, fecha_creacion, fecha_modificacion) => {
  const filas = await db.exec({
    sql: `INSERT INTO diseños_html
    (titulo, fecha_creacion, fecha_modificacion, contenido)
    VALUES
    (?, ?, ?, ?) RETURNING *`,
    bind: [titulo, fecha_creacion, fecha_modificacion, contenido],
    returnValue: 'resultRows',
    rowMode: 'object',
  });
  return filas[0];
};
const obtenerDiseños = async () => {
  return await db.exec({
    sql: `SELECT id, titulo, fecha_creacion,
    fecha_modificacion, contenido,
    ancho_pagina, ancho_ticket, aplicar_dithering,
    algoritmo_impresion
    FROM diseños_html
    ORDER BY id ASC`,
    returnValue: 'resultRows',
    rowMode: 'object',
  });
};

const obtenerDiseñoPorId = async (id) => {

  const diseños = await db.exec({
    sql: `SELECT id, titulo, fecha_creacion,
    fecha_modificacion, contenido,
    ancho_pagina, ancho_ticket, aplicar_dithering,
    algoritmo_impresion
    FROM diseños_html
    WHERE id = ?`,
    returnValue: 'resultRows',
    rowMode: 'object',
    bind: [id],
  });
  return diseños[0];
};

const eliminarDiseño = async (id) => {
  const filas = await db.exec({
    sql: `DELETE FROM diseños_html
    WHERE id = ?
    RETURNING *`,
    bind: [id],
    returnValue: 'resultRows',
    rowMode: 'object',
  });
  return filas[0];
};
self.onmessage = async (evento) => {
  const accion = evento.data[0];
  const argumentos = evento.data[1];
  switch (accion) {
    case 'iniciar':
      await iniciar();
      self.postMessage(['iniciado']);
      break;
    case 'insertar_diseño':
      const diseñoRecienInsertado = await insertarDiseño(
        argumentos.titulo,
        argumentos.contenido,
        argumentos.fecha_creacion,
        argumentos.fecha_modificacion,
      );
      self.postMessage(['diseño_insertado', diseñoRecienInsertado]);
      break;
    case 'obtener_diseños':
      const diseños = await obtenerDiseños();
      self.postMessage(['diseños_obtenidos', diseños]);
      break;
    case 'obtener_diseño':
      const diseño = await obtenerDiseñoPorId(argumentos.id);
      self.postMessage(['diseño_obtenido', diseño]);
      break;
    case 'actualizar_diseño':
      const diseñoRecienActualizado = await actualizarDiseño(
        argumentos.id,
        argumentos.contenido,
        argumentos.fecha_modificacion,
        argumentos.titulo,
      );
      self.postMessage(['diseño_actualizado', diseñoRecienActualizado]);
      break;
    case 'eliminar_diseño':
      const diseñoRecienEliminado = await eliminarDiseño(
        argumentos.id,
      );
      self.postMessage(['diseño_eliminado', diseñoRecienEliminado]);
      break;
  }
};
