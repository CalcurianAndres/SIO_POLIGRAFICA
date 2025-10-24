const express = require('express');
const Trabajo = require('../database/models/trabajos.model');
const Gestion = require('../database/models/gestiones.model');
const Orden = require('../database/models/orden.model');
var moment = require('moment'); // require
const { find } = require('underscore');


const app = express();

app.get('/api/maquina-orden/:id', (req, res)=>{
    let orden = req.params.id;

    Trabajo.find({orden})
                .populate('maquina')
                .sort('pos')
                .exec((err, maquinasDB)=>{
                    if( err ){
                        return res.status(400).json({
                           ok:false,
                           err
                           });
                       }
                       
              
                       res.json({
                        maquinasDB
                       })
                })
});

app.get('/api/trabajos/:id', (req, res)=>{

    let id = req.params.id;

    Trabajo.find({maquina:id})
            .populate('maquina')
            .exec((err, trabajoDB)=>{
     if( err ){
          return res.status(400).json({
             ok:false,
             err
             });
         }
         

         res.json({
             trabajo:trabajoDB
         })
    })




    // // --CONSULTA A LA COLECCION DE GRUPOS--
    // Grupo.find((err, gruposBD)=>{

    //     // --EN CASO DE ERROR--
    //     if( err ){
    //         return res.status(400).json({
    //             ok:false,
    //             err
    //         });
    //     }

    //     // --MOSRAR LOS GRUPOS--
    //     res.json({
    //         grupos:gruposBD
    //     })

    // })

});

app.get('/api/orden/etapa/:id', (req, res)=>{
    Trabajo.find({orden:req.params.id})
            .exec((err, trabajosDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }

                res.json(trabajosDB)
            }) 
});

app.get('/api/trabajos', (req, res)=>{
    Trabajo.find({status:true})
            .populate('maquina')
            .populate({path:'orden', populate:{path: 'producto', select:'producto ejemplares grupo'}})
            .exec((err, trabajosDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }

                res.json(trabajosDB)
            });
});

app.post('/api/trabajos/acelerar', (req, res)=>{

    const body = req.body;
    // ////console.log(body)

    // let _fecha = moment(body.fecha).subtract(1, 'day')
    // _fecha = moment(_fecha).format('yyyy-MM-DD')

    // Trabajo.findByIdAndUpdate(body.trabajo,{fecha:_fecha},(err, actual)=>{
    //         if( err ){
    //             return res.status(400).json({
    //                 ok:false,
    //                 err
    //             });
    //         }
    // });


    const UpdateFecha = new Promise((resolve, reject)=>{
        let _fecha = moment(body.fecha).subtract(1, 'day')
        _fecha = moment(_fecha).format('yyyy-MM-DD')

         Trabajo.findByIdAndUpdate(body.trabajo,{fecha:_fecha},(err, actual)=>{
             if( err ){
                 reject(
                     res.status(400).json({
                     ok:false,
                     err})
                 )
              }

              let pos = actual.pos +1;

             resolve({orden:body.orden,trabajo:body.trabajo,pos:pos})
    })
    })

    UpdateFecha
        .then(function(resolve){
            Trabajo.find({orden:resolve.orden}) 
            .sort('pos')
            .populate('maquina')
            .exec((err, ordens)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }
            let pos = ordens.filter(x=> x._id == resolve.trabajo)
            pos = pos+1;
            let All_trabajos


            
            for(let i=0; i<ordens.length; i++){

                    if(ordens[i].pos === resolve.pos){
                        let y = i-1;
                        Trabajo.findByIdAndUpdate(ordens[i]._id,{fechaI:ordens[y].fecha}, (err, done)=>{
                            if( err ){
                                return res.status(400).json({
                                    ok:false,
                                    err
                                });
                            }
                        });
                    }

                //    if(i == ordens.length - 1){
                     
                //         // ////console.log(ordens[i].fecha)
                     
                //     }else{
                //         let y = i+1;
                //         if(ordens[i].fecha < ordens[y].fechaI){
                //             ordens[y].fechaI = ordens[i].fecha
                         
                //             let xfecha = moment(ordens[y].fecha).subtract(1, 'day')
                //             xfecha = moment(xfecha).format('yyyy-MM-DD')
                //             ordens[y].fecha = xfecha
                         
                //             Trabajo.findByIdAndUpdate(ordens[y]._id,{fechaI:ordens[i].fecha},(err, done)=>{
                //                 if( err ){
                //                         return res.status(400).json({
                //                          ok:false,
                //                          err
                //                        });
                //                     }

                //             })
                //         }
                //     }
             
           }
        })
        })


    res.json('ok')

});

app.post('/api/trabajos/retrasar', (req, res)=>{

    const body = req.body;
    // ////console.log(body)

    // ////console.log(_fecha,'_fecha',body.fecha)

    // Trabajo.findByIdAndUpdate(body.trabajo,{fecha:_fecha},(err, actual)=>{
    //         if( err ){
    //              return res.status(400).json({
    //                  ok:false,
    //                  err
    //              });
    //          }
    // });

    const UpdateFecha = new Promise((resolve, reject)=>{
        let _fecha = moment(body.fecha).add(1, 'day')
        _fecha = moment(_fecha).format('yyyy-MM-DD')

         Trabajo.findByIdAndUpdate(body.trabajo,{fecha:_fecha},(err, actual)=>{
             if( err ){
                 reject(
                     res.status(400).json({
                     ok:false,
                     err})
                 )
              }

             resolve({orden:body.orden,trabajo:body.trabajo})
    });
    // resolve({orden:body.orden,trabajo:body.trabajo})

    })

    UpdateFecha
        .then(function(resolve){


            Trabajo.find({orden:resolve.orden}) 
            .sort('pos')
            .populate('maquina')
            .exec((err, ordens)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }
            let pos = ordens.filter(x=> x._id == resolve.trabajo)
            let All_trabajos

            
            for(let i=0; i<ordens.length; i++){

                   if(i == ordens.length - 1){
                     
                        // ////console.log(ordens[i].fecha)
                     
                    }else{
                        let y = i+1;
                        if(ordens[i].fecha > ordens[y].fechaI){
                            ordens[y].fechaI = ordens[i].fecha
                         
                            let xfecha = moment(ordens[y].fecha).add(1, 'day')
                            xfecha = moment(xfecha).format('yyyy-MM-DD')
                            ordens[y].fecha = xfecha
                         
                            Trabajo.findByIdAndUpdate(ordens[y]._id,{fechaI:ordens[i].fecha, fecha:xfecha},(err, done)=>{
                                if( err ){
                                        return res.status(400).json({
                                         ok:false,
                                         err
                                       });
                                    }

                            })
                        }
                    }
             
           }
        })

        }) 

    // Trabajo.find({orden:body.orden}, (err, ordens)=>{
    //     if( err ){
    //         return res.status(400).json({
    //             ok:false,
    //             err
    //         });
    //     }
        

    //     for(let i=0; i<ordens.length; i++){
    //         if(ordens[i].maquina == body.maquina._id){
    //             // ////console.log('_i_')
    //             for(let x = i; x<ordens.length; x++){
    //                 Trabajo.find({maquina:ordens[x].maquina, fechaI:{ $gte: body.fecha }},(err, trabajoDB)=>{
    //                     if( err ){
    //                         return res.status(400).json({
    //                             ok:false,
    //                             err
    //                         });
    //                     }
    //                     for(let y = 0; y<trabajoDB.length; y++){
    //                         let fechaI = trabajoDB[y].fechaI
    //                         let fecha = trabajoDB[y].fecha
    //                         // ////console.log(trabajoDB[y]._id,'/',body.orden)
    //                         if(trabajoDB[y]._id != body.trabajo){
    //                             fechaI = moment(trabajoDB[y].fechaI).add(body.dias, 'day')
    //                             fechaI = moment(fechaI).format('yyyy-MM-DD')
    //                             fecha = moment(trabajoDB[y].fecha).add(body.dias, 'day')
    //                             fecha = moment(fecha).format('yyyy-MM-DD')
    //                         }
    //                         Trabajo.findByIdAndUpdate(trabajoDB[y]._id,{fechaI,fecha},(err, updated)=>{
    //                             if( err ){
    //                                 return res.status(400).json({
    //                                     ok:false,
    //                                     err
    //                                 });
    //                             }
    //                             // ////console.log(updated)
    //                         })
    //                     }

    //                 });
    //             }
    //         }
    //     }
    // })

    res.json('ok')

});

app.post('/api/gestion', (req, res)=>{

    const body = req.body;



    Trabajo.find({fechaI: {$and:[{$gte:body.fecha}, {$lte:body.fecha}]}})
            .populate('maquina')
            .populate({path:'orden', populate:{path: 'orden.producto', select:'producto ejemplares'}})
            .exec((err, trabajosDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }

                res.json(trabajosDB)
            });
});

app.post('/api/trabajos', (req, res)=>{
    // maquina:{
    //     type:Schema.Types.ObjectId,
    //     ref: 'maquina'
    // },
    // fecha:{
    //     type:String,
    // },
    // OrdenProduccion :{
    //     type:Schema.Types.ObjectId,
    //     ref: 'op'
    // },

    const body = req.body;

    const NewOrden = new Trabajo({
        maquina:body.maquina,
        fechaI:body.fechaI,
        fecha:body.fecha,
        orden:body.orden,
        pos:body.pos
    })

    NewOrden.save((err, maquinas)=>{

        // --EN CASO DE ERROR--
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json({
            maquinas:maquinas
        });

    });


});

app.get('/api/finalizar-trabajos', async (req, res) => {
    const HOY = moment().format('YYYY-MM-DD');

    try {
        const ordenes = await Orden.find({}); // puedes agregar filtros si quieres limitar
        for (const orden of ordenes) {
            const gestiones = await Gestion.find({ orden: orden._id });

            if (!gestiones.length) continue;

            let totalHojas = 0;
            let totalProductos = 0;

            for (const g of gestiones) {
                totalHojas += Number(g.hojas) || 0;
                totalProductos += Number(g.productos) || 0;
            }

            await Orden.findByIdAndUpdate(
                orden._id,
                {
                    paginas_o: totalHojas,
                    cantidad_o: totalProductos,
                }
            );
        }

        return res.json({
            ok: true,
            msg: 'Todas las órdenes fueron actualizadas correctamente'
        });

    } catch (err) {
        return res.status(500).json({
            ok: false,
            msg: 'Error al procesar las órdenes',
            err
        });
    }
});


app.put('/api/finalizar-trabajo', (req, res)=>{
    let body = req.body;
    HOY = moment().format('yyyy-MM-DD');


    Gestion.find({orden:body.id})
            .exec((err, gestion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        let Hojas   = 0
        let productos = 0
        let ultimo = gestion.length-1
        for(let i = 0; i<gestion.length; i++){
            Hojas = Number(Hojas) + Number(gestion[i].hojas);
            productos = Number(productos) + Number(gestion[i].productos)

            ////console.log(Hojas, '- ',productos)

            
            if(i === ultimo){
                ////console.log(Hojas,'/',productos)
                Orden.findByIdAndUpdate(gestion[0].op, {paginas_o:Hojas, cantidad_o:productos}, (err, orden_modefied)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }
                
                    // ////console.log('orden m', orden_modefied)
                })
            }
        }
    })

    Trabajo.findByIdAndUpdate(body.id, {status:false}, (err, trabajoDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        let pos = trabajoDB.pos +1;
        let orden = trabajoDB.orden

        Trabajo.findOneAndUpdate({orden,pos}, {fechaI:this.HOY}, (err, trabajoDB)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }

        res.json('done')


        })
    })
})

app.put('/api/trabajo/:id', (req, res)=>{
    let id = req.params.id;
    let body = req.body

    Trabajo.findByIdAndUpdate(id, body, (err, trabajoDBu)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json('done')
    })
})

app.post('/api/grupos', (req, res)=>{

    // --SE ACORTA EL REQUEST--
    let body = req.body;

// ----SE VACIA EL BODY EN UNA NUEVA CLASE DEL MODELO---
    const NewGrupo = new Grupo({
        nombre: body.nombre,
        tipos:body.tipos
    })

    // ////console.log('Esto llega:',body)
    // ////console.log('Esto se va:',NewGrupo)

// ----SE GUARDA LA INFORMACION EN LA BASE DE DATOS---
    NewGrupo.save((err, grupoDB)=>{

        // --EN CASO DE ERROR--
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json({
            NuevoGrupo:grupoDB
        });

    });

});


module.exports = app;