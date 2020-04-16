var express = require('express');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

app.post('/', (req, res) => {
  var body = req.body;

  Usuario.findOne({ email: body.email }, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err,
      });
    }

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - email',
        errors: err,
      });
    }

    if (!bcrypt.compareSync(body.password, usuario.password)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - password',
        errors: err,
      });
    }

    // Crear un token!!!
    // 4hr
    var token = jwt.sign({ usuario }, SEED, {
      expiresIn: 14400,
    });

    usuario.password = ':)';
    res.json({
      ok: true,
      usuario,
      token,
      id: usuario._id,
    });
  });
});

module.exports = app;
