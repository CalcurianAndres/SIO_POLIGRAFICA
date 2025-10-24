const express = require('express');
const app = express();

const Departamento = require('../database/models/departamento.model')

app.post('/api/departamento', (req, res)=>{
    let body = req.body;

    let nuevoDepartamento = new Departamento(body)

    nuevoDepartamento.save((err, Departamento)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(Departamento)
    })
})

app.get('/api/departamento', (req, res)=>{
    
    Departamento.find((err, DepartamentoDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(DepartamentoDB)
    })
})


module.exports = app;