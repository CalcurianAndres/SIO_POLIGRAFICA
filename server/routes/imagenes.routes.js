const express = require('express');
const fs = require('fs');
const path = require('path');
const { verificarToken } = require('../auth/autenticacion');

const app = express();

app.get('/api/imagen/:tipo/:img', (req, res)=>{

    let tipo = req.params.tipo;
    let img = req.params.img;

    let pathImg = path.resolve(__dirname, `../uploads/${ tipo }/${ img }`);

    if(fs.existsSync(pathImg)){
        res.sendFile(pathImg)
    }else{
        let noImage = path.resolve(__dirname, '../assets/no-image.jpg');
        res.sendFile(noImage);
    }


});

module.exports = app;