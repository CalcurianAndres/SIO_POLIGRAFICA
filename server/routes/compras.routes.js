const express = require('express');
const app = express();

const fabricante = require('../database/models/fabricante.model')
const proveedor = require('../database/models/proveedores.model')

app.post('/api/compras/proveedor', (req, res)=>{
    let body = req.body;

    //console.log(body)
    let proveedor_ = new proveedor(body).save((err, nuevoProveedor)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(nuevoProveedor)
    })
})

app.get('/api/compras/proveedor', (req, res)=>{
    proveedor.find()
                .exec((err, proveedorDB)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    res.json(proveedorDB)
                })
})

app.put('/api/compras/proveedor/:id', (req, res)=>{

    let id = req.params.id
    let body = req.body;

    proveedor.findByIdAndUpdate(id, body)
                .exec((err, FabricanteDB)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    res.json(FabricanteDB)
                })
})

app.post('/api/compras/fabricante', (req, res)=>{

    
    let body = req.body;
    //console.log(body)

    let fabricante_ = new fabricante(body).save((err, nuevoFabricante)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(nuevoFabricante)
    })

})

app.get('/api/compras/fabricante', (req, res)=>{
    fabricante.find()
                .exec((err, FabricanteDB)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    res.json(FabricanteDB)
                })
})

app.put('/api/compras/fabricante/:id', (req, res)=>{

    let id = req.params.id
    let body = req.body;

    //console.log(body)
    fabricante.findByIdAndUpdate(id, body)
                .exec((err, FabricanteDB)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    res.json(FabricanteDB)
                })
})

module.exports = app;