const express = require('express');
const app = express();

const Devolucion = require('../database/models/devolucion.model');
const Almacenado = require('../database/models/almacenado.model');
const Lote = require('../database/models/lotes.model')
const Material = require('../database/models/material.model')
const idevolucion = require('../database/models/idevolucion.model')
const usuario = require('../database/models/usuarios.model')

const {FAL006} = require('../middlewares/docs/FAL-006.pdf');

app.get('/api/devolucion', (req, res)=>{

    Devolucion.find({status:'Pendiente'})
    .populate({
        path: 'filtrado',
        populate: {
            path: 'material'
        }
    })
    .exec((err, devolucion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(devolucion)
    })

});


app.delete('/api/devoluciones/:id', (req,res)=>{
     const id = req.params.id

     Devolucion.findByIdAndUpdate(id, {status:'Cancelado'}, (err, devolucion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(devolucion)
     })
})

app.get('/api/reenvio-devolucion/:id', (req, res)=>{
    const id = req.params.id
    Devolucion.findOne({_id:id})
    .exec((err, devolucionDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        let lotes = []
        let materiales = []
        let cantidades = []
        let tabla = '';
        for(let i=0;i<devolucionDB.filtrado.length;i++){

            lotes.push(devolucionDB.filtrado[i].lote)
                Material.findById(devolucionDB.filtrado[i].material, (err, material)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }
        
                    // ////console.log(material.nombre)
                let data = '';
                cantidades.push(`${devolucionDB.filtrado[i].cantidad} ${material.unidad}`)
                if(!material.ancho){
                    if(material.grupo == '61fd54e2d9115415a4416f17' || material.grupo == '61fd6300d9115415a4416f60'){
                        materiales.push(`${material.nombre} (${material.marca}) - Lata:${devolucionDB.filtrado[i].codigo}`)
                        data = `<tr><td>${material.nombre} (${material.marca}) - Lata:${devolucionDB.filtrado[i].codigo}</td>
                        <td>${devolucionDB.filtrado[i].cantidad} ${material.unidad}</td></tr>`;
                    }else{
                        materiales.push(`${material.nombre} (${material.marca})`)
                        data = `<tr><td>${material.nombre} (${material.marca})</td>
                        <td>${devolucionDB.filtrado[i].cantidad} ${material.unidad}</td></tr>`;
                    }
                }else{
                    materiales.push(`${material.nombre} ${material.ancho}x${material.largo} (${material.marca}) - Paleta:${devolucionDB.filtrado[i].codigo}`)
                    data = `<tr><td>${material.nombre} ${material.ancho}x${material.largo} (${material.marca}) - Paleta:${devolucionDB.filtrado[i].codigo}</td>
                    <td>${devolucionDB.filtrado[i].cantidad} ${material.unidad}</td></tr>`;
                }
        
                tabla = tabla + data;
                let final = devolucionDB.filtrado.length -1
                if(i === final){
        
                    FAL006(devolucionDB.orden,1369,materiales,lotes, cantidades, devolucionDB.motivo, devolucionDB.usuario,tabla)
                    res.json('done');
                    // idevolucion.findByIdAndUpdate({_id: 'test'}, {$inc: {seq: 1}}, {new: true, upset:true})
                    //     .exec((err, devolucion)=>{
                    //         if( err ){
                    //             return res.status(400).json({
                    //                 ok:false,
                    //                 err
                    //             });
                    //         }
        
                    //         num_solicitud = devolucion.seq;
                    //         // FAL006(Devolucion.filtrado.orden,num_solicitud,materiales,lotes, cantidades, body.motivo, body.usuario,tabla)
                    //         // let newDEvolucion = new Devolucion({
                    //         //     orden:body.orden,
                    //         //     filtrado:body.filtrado,
                    //         //     motivo:body.motivo
                    //         // }).save();
                    //     })
                }
        
                })
        }
    })
})

app.put('/api/devoluciones/:id', (req, res)=>{

    const body = req.body;
    const id = req.params.id;

    Devolucion.findByIdAndUpdate(id, {status:'Culminado'},(err, devolucionDB)=>{
    //Devolucion.findByIdAndUpdate(id, {_id:id},(err, devolucion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        let lotes = []
        let materiales = []
        let cantidades = []
        let tabla = '';
        for(let i = 0; i<body.length; i++){
            Almacenado.find({material:body[i].material._id,
                                        lote:body[i].lote,
                                        codigo:body[i].codigo},
                                        (error, almacenado)=>{
                                            if( error ){
                                                return res.status(400).json({
                                                    ok:false,
                                                    error
                                                });
                                            }

                                            // ////console.log(almacenado[0].cantidad)
                                            let new_cantidad = 0;
                                            if(body[i].material.grupo === '61fd721fd9115415a4416f65'){
                                                new_cantidad = Number(almacenado[0].cantidad) + body[i].cantidad
                                            }else{
                                                new_cantidad = Number(almacenado[0].cantidad) + (body[i].cantidad/body[i].material.neto)
                                            }

                                            new_cantidad = Number(new_cantidad).toFixed(2)
                                            //console.log(new_cantidad)


                                              Almacenado.findByIdAndUpdate(almacenado[0]._id, {cantidad:new_cantidad}, (err, almacenado_)=>{
                                               if( error ){
                                                   return res.status(400).json({
                                                       ok:false,
                                                       error
                                                   });
                                            }  
                                            })

                                        })
        
        let final = body.length -1;
        if(i === final ){ 
            
            for(let i = 0; i<body.length; i++){
                lotes.push(body[i].lote)
                Material.findById(body[i].material, (err, material)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }
        
                    // ////console.log(material.nombre)
                let data = '';
                cantidades.push(`${body[i].cantidad} ${material.unidad}`)
                if(!material.ancho){
                    if(material.grupo == '61fd54e2d9115415a4416f17' || material.grupo == '61fd6300d9115415a4416f60'){
                        materiales.push(`${material.nombre} (${material.marca}) - Lata:${body[i].codigo}`)
                        data = `<tr><td>${material.nombre} (${material.marca}) - Lata:${body[i].codigo}</td>
                        <td>${body[i].cantidad} ${material.unidad}</td></tr>`;
                    }else{
                        materiales.push(`${material.nombre} (${material.marca})`)
                        data = `<tr><td>${material.nombre} (${material.marca})</td>
                        <td>${body[i].cantidad} ${material.unidad}</td></tr>`;
                    }
                }else{
                    materiales.push(`${material.nombre} ${material.ancho}x${material.largo} (${material.marca}) - Paleta:${body[i].codigo}`)
                    data = `<tr><td>${material.nombre} ${material.ancho}x${material.largo} (${material.marca}) - Paleta:${body[i].codigo}</td>
                    <td>${body[i].cantidad} ${material.unidad}</td></tr>`;
                }
        
                tabla = tabla + data;
                if(i === final){
        
                    idevolucion.findByIdAndUpdate({_id: 'test'}, {$inc: {seq: 1}}, {new: true, upset:true})
                        .exec((err, devolucion)=>{
                            if( err ){
                                return res.status(400).json({
                                    ok:false,
                                    err
                                });
                            }
        
                            num_solicitud = devolucion.seq;
                            // FAL006(body.orden,num_solicitud,materiales,lotes, cantidades, body.motivo, body.usuario,tabla)
                            // let newDEvolucion = new Devolucion({
                            //     orden:body.orden,
                            //     filtrado:body.filtrado,
                            //     motivo:body.motivo
                            // }).save();
                            let usuario_ = devolucionDB.usuario.split(' ')
                            let correo = usuario.findOne({Nombre:usuario_[0]}).exec()
                            Devolucion.findById(id)
                            .populate({
                                path: 'filtrado',
                                populate: {
                                    path: 'material'
                                }
                            })
                            .exec((err, devolucion)=>{
                                FAL006(devolucionDB.orden,num_solicitud,materiales,lotes, cantidades, devolucionDB.motivo, devolucionDB.usuario,tabla,correo.Correo, devolucion.filtrado)
                                res.json('done');
                            })
                        })
                }
        
                })
        
            }
            // res.json(devolucion)
        }
        }

    })

});


app.get('/devolucion/:id', (req, res)=>{
    let id = req.params.id
    Lote.find({_id:id}, (err, Lote)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }


        for(let i=0;i<Lote[0].material.length;i++){

            let mat_ = Lote[0].material[i]

            Almacenado.findOneAndUpdate({lote:mat_.lote, codigo:mat_.codigo}, {cantidad:mat_.EA_Cantidad}, (err, almacenDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }

                //console.log(almacenDB.cantidad, mat_.EA_Cantidad)
            })

            // //console.log(i+1, mat_.lote, mat_.codigo, mat_.EA_Cantidad)
        }

        res.json({ok:true})

    })
})

app.get('/api/devolucion/:lote', async (req, res) => {
    try {
      const id = req.params.lote;
      const lotes = await Lote.find({ _id: id }).exec();
  
      if (lotes.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'No se encontró ningún lote con el ID proporcionado'
        });
      }
  
      for (const material of lotes[0].material) {
        const almacenDB = await Almacenado.findOne({ lote: material.lote, codigo: material.codigo }).exec();
  
        if (!almacenDB) {
          return res.status(400).json({
            ok: false,
            error: 'No se encontró ningún registro en Almacenado para el material especificado'
          });
        }
  
        const nuevaCantidad = Number(almacenDB.cantidad) + Number(material.cantidad);
        almacenDB.cantidad = nuevaCantidad;
        await almacenDB.save();
      }
  
      res.json({ ok: true });
    } catch (error) {
      //console.log(error);
      res.status(500).json({
        ok: false,
        error: 'Ocurrió un error en el servidor'
      });
    }
  });

module.exports = app;