const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.get('/:tipo/:img', (req, res, next) => {
  const tipo = req.params.tipo;
  const img = req.params.img;

  const pathImagen = path.resolve(__dirname, `../uploads/${tipo}/${img}`);
  if (fs.existsSync(pathImagen)) {
    res.sendFile(pathImagen);
  } else {
    const pathNoImagen = path.resolve(__dirname, '../assets/no-img.jpg');
    res.sendFile(pathNoImagen);
  }
});

module.exports = app;
