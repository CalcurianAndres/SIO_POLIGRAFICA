const express = require('express');

const Orden = require('../database/models/orden.model');
const Trabajo = require('../database/models/trabajos.model');
const iasignacion = require('../database/models/iasignacion.modal')
const Producto = require('../database/models/producto.model');
const Gestiones = require('../database/models/gestiones.model')
const Lotes = require('../database/models/lotes.model')
const Grupo = require('../database/models/grupos.model')
const Cancelacion = require('../database/models/cancelaciones.model')
const {NuevaOrden } = require('../middlewares/emails/nuevo.email');
const {SolicitudMateria} = require('../middlewares/emails/solicitudMaterial.email')
const ordendecompra = require('../database/models/ordendecompra.model');


const app = express();

app.get('/api/orden-cerrar/:id', (req, res)=>{
    let id = req.params.id;

    Orden.findByIdAndUpdate(id,{estado:'cerrada'}, (err, cerrada)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        Lotes.find({orden:cerrada.sort}, (err, lotes)=>{
            for(let i=0;i<lotes.length;i++){
                Lotes.findByIdAndUpdate(lotes[i]._id, {cerrado:true}, (err, Lote)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }


                })

            if(i == lotes.length -1){

                res.json(cerrada)
            }
            
            
            }
        })
    })
})

app.post('/api/orden-compra', async (req, res) => {
    try {
        let { orden } = req.body;

        // Verificar si la orden ya existe en la base de datos
        let ordenExistente = await ordendecompra.findOne({ orden });

        if (ordenExistente) {
            return res.status(400).json({
                ok: false,
                message: 'La orden ya existe en la base de datos',
            });
        }

        // Si no existe, guardamos la nueva orden
        let nuevaOrden = new ordendecompra(req.body);
        let ordenGuardada = await nuevaOrden.save();

        res.json({
            ok: true,
            orden: ordenGuardada,
        });
    } catch (err) {
        res.status(500).json({
            ok: false,
            error: err.message,
        });
    }
});


app.get('/api/orden-compra', async (req, res) => {
    try {
        const ordenesDB = await ordendecompra.aggregate([
            // Ordenamos internamente cada producto por fecha
            {
                $addFields: {
                    productos: {
                        $sortArray: {
                            input: "$productos",
                            sortBy: { fecha: 1 } // Ordena cada array por fecha
                        }
                    }
                }
            },
            // Creamos un campo "fechaMasProxima" con la primera fecha del primer producto
            {
                $addFields: {
                    fechaMasProxima: { $arrayElemAt: ["$productos.fecha", 0] }
                }
            },
            // Ordenamos las órdenes por la fecha más próxima
            {
                $sort: { fechaMasProxima: 1 }
            }
        ]);

        // Luego populamos si hace falta
        await ordendecompra.populate(ordenesDB, { path: "cliente" });
        await ordendecompra.populate(ordenesDB, { path: "productos.producto" });

        res.json(ordenesDB);
    } catch (err) {
        res.status(400).json({
            ok: false,
            err
        });
    }
});

app.put('/api/orden-compra/:id', (req, res)=>{
    
    let id = req.params.id
    let body = req.body

    ordendecompra.findByIdAndUpdate(id, body, (err, OrdenDeCompraDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(OrdenDeCompraDB)
    })

})


app.post('/api/orden', (req, res)=>{

    const body = req.body;

    iasignacion.findByIdAndUpdate({_id: 'iterator'}, {$inc: {seq: 1}}, {new: true, upset:true})
                                .exec((err, asignacion)=>{
                                    if( err ){
                                        return res.status(400).json({
                                            ok:false,
                                            err
                                        });
                                    }

                                    let NewOrden = new Orden({
                                        usuario:body.usuario,
                                        fecha_o:body.fecha_o,
                                        montaje:body.montaje,
                                        cantidad:body.cantidad,
                                        cliente:body.cliente,
                                        orden:body.orden_compra,
                                        paginas:body.paginas,
                                        producto:body.producto,
                                        demasia:body.demasia,
                                        fecha_s:body.fecha_s,
                                        e_c:body.e_c,
                                        i_ancho:body.i_ancho,
                                        i_largo:body.i_largo,
                                        observacion:body.observacion,
                                        solicitud:asignacion.seq,
                                        almacen:body.almacen,
                                        paginas_o:body.paginas,
                                        cantidad_o:body.cantidad
                                    })

                                    Producto.findOne({_id:body.producto})
                                            .populate('cliente')
                                            .populate('materiales.producto')
                                            .exec((err, resp)=>{
                                                if( err ){
                                                    return res.status(400).json({
                                                        ok:false,
                                                        err
                                                    });
                                                }

                                                NewOrden.producto = resp;

                                                // //console.log(resp)

                                                NewOrden.save((err, resp)=>{
                                                    if( err ){
                                                        return res.status(400).json({
                                                            ok:false,
                                                            err
                                                        });
                                                    } 
                                                    
                                                    ordendecompra.findById(body.ordencompra._id, (err, Ordendecomprasbd)=>{
                                                        if( err ){
                                                            return res.status(400).json({
                                                                ok:false,
                                                                err
                                                            });
                                                        } 

                                                        if(!Ordendecomprasbd.productos[body.ProductodeProductos].status){
                                                            Ordendecomprasbd.productos[body.ProductodeProductos].status = ''
                                                        }

                                                        let cantidad___ = new Intl.NumberFormat('de-DE').format(resp.cantidad)
                                                        Ordendecomprasbd.productos[body.ProductodeProductos].status = Ordendecomprasbd.productos[body.ProductodeProductos].status + `${resp.sort} por ${cantidad___} Unds. \n`

                                                        //console.log(body.ProductodeProductos)
                                                        ordendecompra.findByIdAndUpdate(Ordendecomprasbd._id, Ordendecomprasbd, (err, done)=>{
                                                            if( err ){
                                                                return res.status(400).json({
                                                                    ok:false,
                                                                    err
                                                                });
                                                            } 


                                                            res.json(resp._id)
                                                        })

                                                    })
                                                                
                                                             NuevaOrden(resp.sort,'Andres','calcurianandres@gmail.com')
                                                             SolicitudMateria(resp.sort,'test')
                                                             NuevaOrden(resp.sort,'Enjimar','enjimar.fajardo@poligraficaindustrial.com')
                                                             NuevaOrden(resp.sort,'Rusbeli','rusbeli.velazquez@poligraficaindustrial.com')
                                                             NuevaOrden(resp.sort,'Raul', 'raul.diaz@poligraficaindustrial.com')
                                                             NuevaOrden(resp.sort,'Carlos','carlos.mejias@poligraficaindustrial.com')
                                                             NuevaOrden(resp.sort,'Enida', 'enida.aponte@poligraficaindustrial.com')
                                                             NuevaOrden(resp.sort,'Freddy', 'freddy.burgos@poligraficaindustrial.com')
            
                                            
                                                })


                                            })



                                })
    

});

app.get('/api/reenvio-solicitus/:op', (req, res)=>{
    let op = req.params.op

    SolicitudMateria(op, 'test')
    res.json('ok')
})

app.get('/api/orden-cliente/:cliente', (req, res)=>{
    let cliente = req.params.cliente

    Orden.find({cliente:cliente, estado:'activo'})
        .exec((err, ordenes)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }
    
            // //console.log(orden)
            res.json(ordenes)
        })
})

app.get('/api/orden-todo', (req, res)=>{

    // Lotes.find()
    // .populate('material.material')
    // .exec((err, adcionalesDB)=>{
    //     for(let n = 0; n<adcionalesDB.length; n++){
    //         for(let n_i = 0; n_i<adcionalesDB[n].material.length; n_i++){
    //             if(!adcionalesDB[n].material[n_i].EA_Cantidad){
    //                 let add = adcionalesDB[n].material[n_i].push({EA_Cantidad:0})
    //                 //console.log(adcionalesDB[n].material[n_i])
    //             }else{
    //                 //console.log('work')
    //             }
    //         }
    //     }
    // })

    Orden.find()
    .populate('cliente')
    .populate('producto.grupo')
    .populate('producto.cliente')
    .populate('producto.materiales')
    .populate({path:'producto', populate:{path:'materiales.producto'}})
    .populate({path:'producto.materiales.producto', populate:{path:'grupo'}})
        // .populate('cliente producto producto.grupo')
        .exec((err, orden)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // //console.log(orden)
        res.json(orden)
    });
})

app.get('/api/orden', (req, res)=>{

    const id = req.params.id;

    Orden.find({$or:[{estado:'activo'},{estado:'Espera'}]})
    .populate('cliente')
    .populate('producto.grupo')
    .populate('producto.cliente')
    .populate('producto.materiales')
    .populate({path:'producto', populate:{path:'materiales.producto'}})
    .populate({path:'producto.materiales.producto', populate:{path:'grupo'}})
        // .populate('cliente producto producto.grupo')
        .exec((err, orden)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(orden)
    });

});

app.get('/api/orden_material', (req, res)=>{

    const id = req.params.id;

    Orden.find({estado:'Espera'})
        .populate('cliente')
        .populate('producto.grupo')
        .populate('producto.cliente')
        .populate('producto.materiales')
        .populate({path:'producto', populate:{path:'materiales.producto'}})
        .populate({path:'producto.materiales.producto', populate:{path:'grupo'}})
        .exec((err, orden)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

    for(let x=0;x<orden.length;x++){
        for(let i=0;i<orden[x].producto.materiales[orden[x].montaje].length;i++){
            let material = orden[x].producto.materiales[orden[x].montaje][i]
            if(material.producto.grupo.nombre != 'Sustrato' && material.cantidad === '0'){
                orden[x].producto.materiales[orden[x].montaje].splice(i,1)
                i--
            }
            // //console.log(orden[x].producto.materiales[orden[x].montaje][i])
        
            // if(x === orden.length-1){
                if(x === orden.length-1 && i === orden[x].producto.materiales[orden[x].montaje].length -1){
                    res.json(orden)
                    // for(let z=0;z<orden.length;z++){
                    //     for(let n=0;n<orden[z].producto.materiales[orden[z].montaje].length;n++){
                    //         let material = orden[z].producto.materiales[orden[z].montaje][n]
                    //         if(material.producto.grupo.nombre != 'Sustrato' && material.cantidad === '0'){
                    //             // //console.log(material,'/',i)
                    //             orden[z].producto.materiales[orden[x].montaje].splice(i,1)
                                
                    //         }
                    //         // //console.log(orden[x].producto.materiales[orden[x].montaje][n])
                        
                    //         if(z === orden.length-1){
                    //             if(n === orden[z].producto.materiales[orden[z].montaje].length -1){    
                    //             }
                    //         }
                            
                    //     }
                        
                    // }
                }
            // }
            
        }
        
    }
    
    });

});

app.get('/api/orden/cancelar/:orden/:motivo', (req, res)=>{




    Orden.findByIdAndUpdate(req.params.orden, {estado:'CANCELADA'}, (err, orden)=>{
         if( err ){
             //console.log(err, 'primero')
             return res.status(400).json({
                 ok:false,
                err
             });
         }
    
         let NewCancelacion = new Cancelacion({
             orden:req.params.orden,
             Motivo:req.params.motivo
         }).save((err, resp)=>{
            //console.log(err, 'segundo')
             if( err ){
                 return res.status(400).json({
                     ok:false,
                     err
                 });
             }
             
             res.json('¡Orden Cancelada!')
         })
    
    })




})
app.get('/api/orden/cancelar/:orden/', (req, res)=>{



    return res.status(400).json({
        ok:false,
        err
    });


})

app.put('/api/orden/:id', (req, res)=>{
    const id = req.params.id;
    const data = req.body

    Orden.findByIdAndUpdate(id, data, (err, ordenEdited)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(ordenEdited)
    })
})

app.get('/api/etiquetar/:id', (req, res)=>{
    const id = req.params.id;
    Orden.findOne({_id:id})
    .populate('cliente')
    .populate('producto.grupo')
    .populate('producto.cliente')
    .populate('producto.materiales')
    .populate({path:'producto', populate:{path:'materiales.producto'}})
    .populate({path:'producto.materiales.producto', populate:{path:'grupo'}})
        // .populate({path:'producto', populate:{path:'grupo materiales.producto', populate:{path:'grupo'}}})
        .exec((err, orden)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        Trabajo.find({orden:id}, (err, trabajos)=>{

            let ultimo = trabajos.filter(x => x.pos == trabajos.length - 1)
            let fecha;
            Gestiones.find({maquina:ultimo[0].maquina, op:id}, (err, gestiones)=>{

                if(gestiones.length > 0){
                    let splitted = gestiones[0].fecha.split('-')
                    fecha = `${splitted[1]}/${splitted[0]}`
                    // //console.log(
                    //     {
                    //         ordenes:orden,
                    //         trabajos:`${splitted[1]}/${splitted[0]}`
                    //     }
                    // )
                }else{
                    fecha = '0/0'
                }
                res.json({
                    ordenes:orden,
                    gestiones:gestiones,
                    trabajos:fecha
                })
            })


        })
    });

})

app.get('/api/orden/:id', (req, res)=>{

    const id = req.params.id;

    Orden.findOne({_id:id})
    .populate('cliente')
    .populate('producto.grupo')
    .populate('producto.cliente')
    .populate('producto.materiales')
    .populate({path:'producto', populate:{path:'materiales.producto'}})
    .populate({path:'producto.materiales.producto', populate:{path:'grupo'}})
        // .populate({path:'producto', populate:{path:'grupo materiales.producto', populate:{path:'grupo'}}})
        .exec((err, orden)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(orden)
    });

});


module.exports = app;