const express = require('express');
const Maquina = require('../database/models/maquinas.model');


const app = express();

app.get('/api/maquinas', (req, res) => {


    // --CONSULTA A LA COLECCION DE MAQUINAS--
    Maquina.find()
        .sort('order')
        .exec((err, maquinasDB) => {

            // --EN CASO DE ERROR--
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            // --MOSRAR LAS MAQUINAS--
            res.json(maquinasDB)

        })

});

app.post('/api/maquinas', (req, res) => {

    // --SE ACORTA EL REQUEST--
    let body = req.body;

    // ----EJEMPLO DE UNA NUEVA MAQUINA---
    //   nombre:'XML200',
    //   tipo:'impresora',
    //   colores:'4',
    //   cph:1000

    // ---COLOCAR EL TIPO EN MAYUSCULA--
    body.tipo = body.tipo.toUpperCase();

    // ----SE VACIA EL BODY EN UNA NUEVA CLASE DEL MODELO---
    const NewMaquina = new Maquina({
        nombre: body.nombre,
        tipo: body.tipo,
        colores: body.colores,
        cph: body.cph,
        precio: body.precio,
        reparacion: body.reparacion
    })

    // ----SE GUARDA LA INFORMACION EN LA BASE DE DATOS---
    NewMaquina.save((err, maquinaDB) => {

        // --EN CASO DE ERROR--
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json({
            NuevaMaquina: maquinaDB
        });

    });

});
app.get('/api/maquinas/:id', (req, res) => {

    // --Obtener el id de la maquina a eliminar--
    const id = req.params.id;

    // --BUSCAR LA MAQUINA CON EL MISMO ID Y ELIMINARLO--
    Maquina.findById(id, (err, maquinaDB) => {
        // --EN CASO DE ERROR--
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA ELIMINADA--
        res.json(maquinaDB);
    });

});

app.put('/api/maquinas/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body;

    Maquina.findByIdAndUpdate(id, body, (err, maquinaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json(maquinaDB)

    });
})

app.delete('/api/maquinas/:id', (req, res) => {

    // --Obtener el id de la maquina a eliminar--
    const id = req.params.id;

    // --BUSCAR LA MAQUINA CON EL MISMO ID Y ELIMINARLO--
    Maquina.findOneAndRemove({ _id: id }, (err, maquinaDB) => {
        // --EN CASO DE ERROR--
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA ELIMINADA--
        res.json({
            NuevaMaquina: maquinaDB
        });
    });

});

module.exports = app;