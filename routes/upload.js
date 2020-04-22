const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const app = express();

const Usuario = require('../models/usuario');
const Medico = require('../models/medico');
const Hospital = require('../models/hospital');

app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {
  const tipo = req.params.tipo;
  const id = req.params.id;

  // Tipos de colección
  const tiposValidos = ['hospitales', 'medicos', 'usuarios'];

  if (tiposValidos.indexOf(tipo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Tipo de colección no es válida',
      errors: {
        mensaje: 'Tipo de colección no es válida',
      },
    });
  }

  if (!req.files) {
    return res.status(400).json({
      ok: false,
      mensaje: 'No seleccionó nada',
      errors: {
        mensaje: 'Debe seleccionar una imagen',
      },
    });
  }

  // Obtener nombre del archivo
  const archivo = req.files.imagen;
  const nombreCortado = archivo.name.split('.');
  const extensionArchivo = nombreCortado[nombreCortado.length - 1];

  // Solo aceptamos esta extensiones
  const extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

  if (extensionesValidas.indexOf(extensionArchivo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Extensión no válida',
      errors: {
        mensaje:
          'Las extensiones válidas son: ' + extensionesValidas.join(', '),
      },
    });
  }

  // Nombre de archivo personalizado
  const nombreArchivo = `${id}-\
${new Date().getMilliseconds()}.\
${extensionArchivo}`;

  subirPorTipo(tipo, id, nombreArchivo)
    .then((data) => {
      // Mover el archivo
      const path = `./uploads/${tipo}/${nombreArchivo}`;
      archivo.mv(path, (err) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al mover archivo',
            errors: err,
          });
        }
      });
      res.json(data);
    })
    .catch((err) => {
      res.status(err.status).json(err.body);
    });
});

/**
 * Actualiza la imagen de un documento
 * @param {'usuarios' | 'medicos'  | 'hospitales'} tipo especifica la colección
 * @param {string} id el id del documento
 * @param {string} nombreArchivo
 * @returns {Promise}
 */
function subirPorTipo(tipo, id, nombreArchivo) {
  return new Promise((resolve, reject) => {
    if (tipo === 'usuarios') {
      Usuario.findById(id, (err, usuario) => {
        if (!usuario) {
          return reject({
            status: 404,
            body: {
              ok: false,
              mensaje: 'Usuario no encontrado',
            },
          });
        }

        const pathViejo = './uploads/usuarios/' + usuario.img;

        // Si existe elimina la imagen anterior
        if (fs.existsSync(pathViejo)) {
          fs.unlinkSync(pathViejo);
        }

        usuario.img = nombreArchivo;

        usuario.save((err, usuarioActualizado) => {
          usuarioActualizado.password = ':)';
          return resolve({
            ok: true,
            mensaje: 'Imagen de usuario actualizada',
            usuario: usuarioActualizado,
          });
        });
      });
    }

    if (tipo === 'medicos') {
      Medico.findById(id, (err, medico) => {
        if (!medico) {
          return reject({
            status: 404,
            body: {
              ok: false,
              mensaje: 'Medico no encontrado',
            },
          });
        }
        const pathViejo = './uploads/medicos/' + medico.img;

        // Si existe elimina la imagen anterior
        if (fs.existsSync(pathViejo)) {
          fs.unlinkSync(pathViejo);
        }

        medico.img = nombreArchivo;

        medico.save((err, medicoActualizado) => {
          return resolve({
            ok: true,
            mensaje: 'Imagen de medico actualizada',
            medico: medicoActualizado,
          });
        });
      });
    }

    if (tipo === 'hospitales') {
      Hospital.findById(id, (err, hospital) => {
        if (!hospital) {
          return reject({
            status: 404,
            body: {
              ok: false,
              mensaje: 'Hospital no encontrado',
            },
          });
        }
        const pathViejo = './uploads/hospitales/' + hospital.img;

        // Si existe elimina la imagen anterior
        if (fs.existsSync(pathViejo)) {
          fs.unlinkSync(pathViejo);
        }

        hospital.img = nombreArchivo;

        hospital.save((err, hospitalActualizado) => {
          return resolve({
            ok: true,
            mensaje: 'Imagen de hospital actualizada',
            hospital: hospitalActualizado,
          });
        });
      });
    }
  });
}
module.exports = app;
