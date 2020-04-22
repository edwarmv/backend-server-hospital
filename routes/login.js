const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Google
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = require('../config/config').CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const SEED = require('../config/config').SEED;

const app = express();
const Usuario = require('../models/usuario');

/**
 * Verifica el token del usuario
 * @param {string} token El token del usuario
 */
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  // const userid = payload['sub'];
  // If request specified a G Suite domain:
  //const domain = payload['hd'];

  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    google: true,
  };
}

/**
 * Autenticación de Google
 */
app.post('/google', async (req, res) => {
  const token = req.body.token;

  const googleUser = await verify(token).catch((err) => {
    return res.status(403).json({
      ok: false,
      mensaje: 'Token no válido',
    });
  });

  Usuario.findOne({ email: googleUser.email }, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err,
      });
    }
    if (usuario) {
      if (usuario.google === false) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Debe usar su autenticación normal',
        });
      } else {
        // Crear un token!!!
        // 4hr
        const token = jwt.sign({ usuario: usuario }, SEED, {
          expiresIn: 14400,
        });

        usuario.password = ':)';
        res.json({
          ok: true,
          usuario,
          token,
          id: usuario._id,
        });
      }
    } else {
      // El usuario no existe. Hay que crearlo
      const usuario = new Usuario();

      usuario.nombre = googleUser.nombre;
      usuario.email = googleUser.email;
      usuario.img = googleUser.img;
      usuario.google = true;
      usuario.password = ':)';

      usuario.save((err, usuario) => {
        // Crear un token!!!
        // 4hr
        const token = jwt.sign({ usuario }, SEED, {
          expiresIn: 14400,
        });

        res.json({
          ok: true,
          usuario,
          token,
          id: usuario._id,
        });
      });
    }
  });
});

/**
 * Autenticación normal
 */
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
