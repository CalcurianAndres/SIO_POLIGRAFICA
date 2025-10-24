const express = require('express');
const Bobina = require('../database/models/bobinas.model');
const Sustrato = require('../database/models/sustrato.model');
const Conversion = require('../database/models/conversiones.model');


const app = express();


app.post('/api/bobina', (req, res)=>{

    const body = req.body;

    const NewBobina = new Bobina({
        Nbobina:body.Nbobina,
        material:body.material,
        marca:body.marca,
        calibre:body.calibre,
        gramaje:body.gramaje,
        ancho:body.ancho,
        peso:body.peso,
        lote:body.lote,
        convertidora:body.convertidora
    })

    NewBobina.save((err, bobina)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json(bobina);
    });

});

app.post('/api/bobina-delete', (req, res)=>{
    const body = req.body;

    Bobina.findByIdAndRemove(body.bobina, (err, deleted)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        Conversion.findOne({sort:body.numero}, (err, conversion)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }
            // ////console.log(conversion.descuentos, 'peso');
            // ////console.log(deleted.peso, 'deleted');

            let descuento;
            let peso;
            let total; 

            descuento = Number(conversion.descuentos) 
            peso = Number(deleted.peso)
            total = descuento + peso;
            // ////console.log(total);

            Conversion.findOneAndUpdate({sort:body.numero},{descuentos:total},{new : true, passRawResult: true}, (err, listo)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }
                ////console.log(listo.descuentos)

                if(listo.descuentos >= listo.peso){
                    Conversion.findOneAndUpdate({sort:body.numero}, {status:false}, (err, terminado)=>{
                        if( err ){
                            return res.status(400).json({
                                ok:false,
                                err
                            });
                        }
                    })
                }
            })

            
        })

        res.json('Esta bobina fue descontada con exito')
    })
});

app.get('/api/conversiones', (req, res)=>{
    Conversion.find({status:true}, (err, conversions)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json(conversions);
    });
});

app.get('/api/bobina', (req, res)=>{

    Bobina.find((err, bobina)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json(bobina);
    });

});

app.get('/api/sustrato', (req, res)=>{

    Sustrato.find((err, sustrato)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // --MOSTRAR NUEVA MAQUINA AÑADIDA--
        res.json(sustrato);
    });

});

app.post('/api/sustrato', (req, res)=>{
    const body = req.body;
    let num_Conv;

    ////console.log(body)

    let NewConv = new Conversion({
        bobina:'xxx',
        peso:body.peso
    })

    ////console.log('new', NewConv)
    
    NewConv.save((err, conv)=>{
        // if( err ){
        //     return res.status(400).json({
        //         ok:false,
        //         err
        //     });
        // }


        num_Conv = conv.sort;
        res.json(num_Conv)
    })

});

app.put('/api/sustrato/:id', (req, res)=>{
    const body = req.body
    const id = req.params.id

    //console.log(id)
    //console.log(body)

    Bobina.findOneAndUpdate({_id:id}, body,(err, sustrato)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json('done')
    })
})

app.post('/api/sustratos/:id', (req, res)=>{
    const id = req.params.id;
    const body = req.body

    ////console.log(id)

    Sustrato.findByIdAndRemove(id, (err, eliminado)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json({
            ok:'eliminado'
        })
    })
})

module.exports = app;