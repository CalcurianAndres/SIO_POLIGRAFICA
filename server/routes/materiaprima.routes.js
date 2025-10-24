const express = require('express');
const app = express();

const ingresosNew = require('../database/models/ingresos-new.model')
const materiales = require('../database/models/materiales.model')

// REGISTRAR NUEVA MATERIA PRIMA
app.post('/api/materia-prima', async (req, res)=>{

    let body = req.body

    function definirGrupo(){
        return new Promise(resolve =>{
            if(body.nuevo){
                let NuevoGrupo = new Materia({
                    nombre:body.grupo
                })

                NuevoGrupo.save((err, grupoDB)=>{

                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    body.grupo = grupoDB._id;
                    resolve(body.grupo)
                })
            }else{
                
                    resolve(body.grupo)
            }
        })
    }

    const material = new materiales({
        grupo:await definirGrupo(),
        nombre:body.nombre,
        marca:body.marca,
        ancho:body.ancho,
        largo:body.largo,
        gramaje:body.gramaje,
        calibre:body.calibre,
        cantidad:body.cantidad,
        unidad:body.unidad,
        presentacion:body.presentacion,
        color:body.color,
        neto:body.neto,
        cinta:body.cinta,
        proveedor:body.proveedor
    });

    material.save((err, materialDB) => {

        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        const NewIngreso = new ingresosNew({
            material:materialDB._id
        }).save((err, IngresoNuevo)=>{

            if(err) {
                return res.status(400).json({
                    ok:false,
                    err
                });
            }

            res.json({
                ok:true,
                material: IngresoNuevo
            })
        })


    });

})

app.get('/api/materia-prima', (req, res)=>{
    materiales.find()
        // .populate('proveedor')
        .populate('grupo')
        .exec((err, MaterialesDB)=>{
        if(err) {
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(MaterialesDB)
    })
})

app.put('/api/materia-prima/:id', (req, res)=>{
    const id = req.params.id;
    let body = req.body;

    materiales.updateMany(body.info, body.data, (err, materialDB) =>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json('exito')
    })
})

module.exports = app;