var express = require('express');
var Medico = require('../models/medico');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

/**
 * Obtener todos los medicos
 */
app.get('/', (req, res) => {
  const desde = Number(req.query.desde || 0);
  Medico.find({})
    .skip(desde)
    .limit(5)
    .populate('usuario', 'nombre email')
    .populate('hospital')
    .exec((err, medicos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error cargando medicos',
          errors: err,
        });
      }
      Medico.count({}, (err, total) => {
        res.json({
          ok: true,
          medicos,
          total,
        });
      });
    });
});

/**
 * Actualizar médico
 */
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
  const id = req.params.id;
  const body = req.body;

  Medico.findById(id, (err, medico) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al buscar médico',
        errors: err,
      });
    }

    if (!medico) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El médico con el id: ' + id + 'no existe',
        errors: { message: 'No existe un médico con ese ID' },
      });
    }

    medico.nombre = body.nombre;
    medico.usuario = req.usuario._id;
    medico.hospital = body.hospital;

    medico.save((err, medicoGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar médico',
          errors: err,
        });
      }

      res.json({
        ok: true,
        medico: medicoGuardado,
      });
    });
  });
});

/**
 * Crear un nuevo médico
 */
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
  const body = req.body;

  const medico = new Medico({
    nombre: body.nombre,
    usuario: req.usuario._id,
    hospital: body.hospital,
  });

  medico.save((err, medicoGuardado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al crear médico',
        errors: err,
      });
    }
    res.status(201).json({
      ok: true,
      medico: medicoGuardado,
    });
  });
});

/**
 * Borrar un hospital
 */
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
  const id = req.params.id;

  Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al borrar medico',
        errors: err,
      });
    }
    if (!medicoBorrado) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No existe un médico con ese id',
        errors: { message: 'No existe un médico con ese id' },
      });
    }
    res.status(200).json({
      ok: true,
      medico: medicoBorrado,
    });
  });
});

module.exports = app;
