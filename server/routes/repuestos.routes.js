const express = require('express');
const app = express();
const Categoria = require('../database/models/categoria.model');
const Repuesto = require('../database/models/repuesto.model');
const Pieza = require('../database/models/piezas.model');
const RepuestoSolicitud = require('../database/models/partesr.model')
const irepuestos = require('../database/models/irepuestos.model')
const iasignacionr = require('../database/models/iasignacionrepuesto.model')
const {FAL007} = require('../middlewares/docs/FAL-007.pdf')
const {FAL008} = require('../middlewares/docs/FAL-008.pdf')

app.post('/api/categoria', (req, res) =>{
    let body = req.body;

    let Categoria_ = new Categoria(body)

    Categoria_.save((err, CategoriaDB)=>{
        res.json({
            categorias:CategoriaDB
        })
    })
})

app.get('/api/categoria', (req, res)=>{
    Categoria.find({}, (err, CategoriaDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        res.json({
            categorias:CategoriaDB
        })
    })
})

app.post('/api/repuesto', (req, res) =>{
    let body = req.body;
    let Repuesto_ = new Repuesto(body)

    Repuesto.findOne({ parte: body.parte, categoria: body.categoria, maquina:body.maquina }, (err, repuesto) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        } else if (repuesto) {
            res.json({
                error:{
                    mensaje:'Este repuesto ya existe en la base de datos'
                }
            })
            return 
        }

        Repuesto_.save((err, RepuestoDB)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }
            res.json({
                repuesto:RepuestoDB
            })
        })
    })
})

app.put('/api/repuesto/:id', (req, res) => {
    const { _id, ...body } = req.body;

    Repuesto.updateOne({ _id: req.params.id }, body, (err, RepuestoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            repuesto: RepuestoDB
        });
    });
});

app.get('/api/repuesto', (req, res)=>{
    Repuesto.find({}, (err, RepuestoDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        res.json({
            repuesto:RepuestoDB
        })
    })
})

app.post('/api/pieza', (req, res) =>{
    let body = req.body;
    //console.log(body)

    Pieza.findOne({repuesto:body.repuesto}, (err, repuesto)=>{
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        } 
        if (repuesto) {
            Pieza.findByIdAndUpdate(repuesto._id, {$inc: {cantidad: body.cantidad}}, (err, updated)=>{
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                } 
                res.json(updated)
            })
        }else{
            let Piece = new Pieza(body).save((err, NuevaPieza)=>{
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }

                res.json({
                    pieza:NuevaPieza
                })
            })
        }
    })
})

app.put('/api/pieza/:id', (req, res) =>{
    const { _id, ...body } = req.body;

    Pieza.updateOne({ _id: req.params.id }, body, (err, PiezaDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        res.json({
            pieza:PiezaDB
        })
    })
})

app.get('/api/pieza', (req, res)=>{
    Pieza.find()
        .populate('repuesto')
        .sort({ 'repuesto.nombre': 1 })
        .exec((err, piezaDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        res.json({
            pieza:piezaDB
        })
    })
})

app.post('/api/solicitudrepuesto', (req, res)=>{
    const body = req.body;  

    //console.log(body)

    let requisicion = new RepuestoSolicitud(body).save((Requisicion, err)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        res.json(Requisicion)
    })

})

app.get('/api/solicitudrepuesto', (req, res)=>{
    
    RepuestoSolicitud.find({status:'espera'}) 
                .populate('repuestos.repuesto')
                .populate({path:'repuestos.repuesto', populate:{path:'maquina'}})
                .populate({path:'repuestos.repuesto', populate:{path:'categoria'}})
                .exec((err, Requisicion)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }
                    res.json(Requisicion)
    })

})

app.put('/api/solicitudrepuesto/:id', (req, res)=>{

    let estado = req.body.estado;
    let id = req.params.id;
    
    RepuestoSolicitud.findByIdAndUpdate(id, {status:estado}, (err, solicitud)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        if(estado === 'Aprobado'){
            RepuestoSolicitud.findOne({_id:id})
                .populate('repuestos.repuesto')
                .populate({path:'repuestos.repuesto', populate:{path:'maquina'}})
                .populate({path:'repuestos.repuesto', populate:{path:'categoria'}})
                .exec((err, NewRequisicion)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    irepuestos.findByIdAndUpdate({_id: 'i'}, {$inc: {seq: 1}}, {new: true, upset:true}).then(function(count) {
                        let table = '';
                    let nparte = [];
                    let repuesto = [];
                    let categoria = [];
                    let maquina = [];
                    let cantidad = [];
                    for(let i=0;i<NewRequisicion.repuestos.length;i++){
                        table = table + `<tr>
                            <td>${NewRequisicion.repuestos[i].repuesto.parte}</td>
                            <td>${NewRequisicion.repuestos[i].repuesto.nombre}</td>
                            <td>${NewRequisicion.repuestos[i].repuesto.categoria.nombre}</td>
                            <td>${NewRequisicion.repuestos[i].repuesto.maquina.nombre}</td>
                            <td>${NewRequisicion.repuestos[i].cantidad}Und</td>
                        </tr>`

                        nparte.push(NewRequisicion.repuestos[i].repuesto.parte);
                        repuesto.push(NewRequisicion.repuestos[i].repuesto.nombre);
                        categoria.push(NewRequisicion.repuestos[i].repuesto.categoria.nombre);
                        maquina.push(NewRequisicion.repuestos[i].repuesto.maquina.nombre);
                        cantidad.push(NewRequisicion.repuestos[i].cantidad)
                    
                        if(i === NewRequisicion.repuestos.length -1){
                            FAL007(table, nparte, repuesto, categoria, maquina, cantidad, NewRequisicion.usuario, NewRequisicion.motivo,count.seq)
                            res.json(NewRequisicion)
                        }
                    }
                    
                    })
                    .catch(function(error) {
                        throw error;
                    });
                    
    })
        }else{
            res.json(solicitud)
        }

    })



})

app.get('/api/repuestos-aprobados', (req, res)=>{
    
    RepuestoSolicitud.find({status:'Aprobado'}) 
                .populate('repuestos.repuesto')
                .populate({path:'repuestos.repuesto', populate:{path:'maquina'}})
                .populate({path:'repuestos.repuesto', populate:{path:'categoria'}})
                .exec((err, Requisicion)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }
                    res.json(Requisicion)
    })

})

app.put('/api/descuento-repuesto/:id', (req, res)=>{
    let id = req.params.id;
    let body = req.body;


    let asignacion = ''
    iasignacionr.findByIdAndUpdate({_id: 'i'}, {$inc: {seq: 1}}, {new: true, upset:true}).then(function(count) {
        asignacion = count.seq
        RepuestoSolicitud.findByIdAndUpdate(id, {status:'Finalizada', asignacion}, (err, repuesto)=>{
        // RepuestoSolicitud.findByIdAndUpdate(id, {status:'Aprobado'}, (err, repuesto)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
    
        let table = '';
        let nparte = [];
        let parte = [];
        let categoria = [];
        let maquina = [];
        let Ubicacion = [];
        let cantidad = []
    
    
        
    
        for(let i=0;i<body.repuestos.length;i++){
                // Pieza.findOneAndUpdate({repuesto:body.repuestos[i].repuesto._id}, {$inc: {cantidad: -body.repuestos[i].cantidad}}, (err, updated)=>{
                Pieza.findOneAndUpdate({repuesto:body.repuestos[i].repuesto._id}, {}, (err, updated)=>{
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }
    
                table = table + `<tr>
                                <td>${body.repuestos[i].repuesto.parte}</td>
                                <td>${body.repuestos[i].repuesto.nombre}</td>
                                <td>${body.repuestos[i].repuesto.categoria.nombre}</td>
                                <td>${body.repuestos[i].repuesto.maquina.nombre}</td>
                                <td>${body.repuestos[i].ubicacion}</td>
                                <td>${body.repuestos[i].cantidad}</td>
                                </tr>`;
                nparte.push(body.repuestos[i].repuesto.parte)
                parte.push(body.repuestos[i].repuesto.nombre)
                categoria.push(body.repuestos[i].repuesto.categoria.nombre)
                maquina.push(body.repuestos[i].repuesto.maquina.nombre)
                Ubicacion.push(body.repuestos[i].ubicacion)
                cantidad.push(body.repuestos[i].cantidad)
                        
                                if(i === body.repuestos.length -1){
                                    FAL008(table, nparte, parte, categoria, maquina, Ubicacion, cantidad, body.motivo, body.usuario, asignacion)
                                    res.json('done')
                                }
            })
    
    
    
        }
    
        })
    });

})

app.get('/api/solicitud-repuestos-asignadas/:asignacion', (req, res)=>{
    let asignacion = req.params.asignacion
    RepuestoSolicitud.findOne({asignacion}) 
                .populate('repuestos.repuesto')
                .populate({path:'repuestos.repuesto', populate:{path:'maquina'}})
                .populate({path:'repuestos.repuesto', populate:{path:'categoria'}})
                .exec((err, Requisicion)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }
                    res.json(Requisicion)
    })
})

app.get('/correo', (req, res)=>{
    newCounter = iasignacionr({_id:'i',seq:'24000'}).save((err, frinchi)=>{
        if(err){
            console.log(err)
        }
        //console.log(frinchi)
    })
    res.json('hecho')
})

module.exports = app;