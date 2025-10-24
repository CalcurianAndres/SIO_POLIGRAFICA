const express = require('express');
const app = express();

const almacenado = require('../database/models/almacenado.model')
const Lote = require('../database/models/lotes.model')
const asustrato = require('../database/models/analisis.sustrato.model')
const atinta = require('../database/models/analisis.tinta.model')

app.get('/api/analisis/:lote', (req, res)=>{

    let lote = req.params.lote

    almacenado.find({lote})
        .populate('material')
        .exec((err, almacenado)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(almacenado)
    })
})


app.get('/api/verlote/:lote', (req, res)=>{
    let lote = req.params.lote

    Lote.find({_id:lote})
        .populate('material.material')
        .exec((err, _lote)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }

            let materiales=[]

            for(let i=0; i<_lote[0].material.length;i++){
                materiales.push(`${_lote[0].material[i].material.nombre} / cantidad:${_lote[0].material[i].cantidad}`)
            }

            res.json(materiales)
        })
})

app.post('/api/analisis-sustrato', (req, res)=>{

    let body = req.body;

    asustrato.findOne({lote:body.lote}, (err, asustratoDB)=>{
        if(!asustratoDB){
            let analisis = new asustrato(body).save((err, nuevoAnalisisDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }
            })
            res.json('ok')
            return
        }else{
            asustrato.findByIdAndUpdate(asustratoDB._id, body, {new: true, upset:true}, (err, AnalisisDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }

                res.json({resultado:AnalisisDB.resultado})
                //console.log({resultado:AnalisisDB.resultado})
                return

            })
        }
    })

})

app.get('/api/analisis-sustrato/:lote', (req, res)=>{

    let lote = req.params.lote;

    asustrato.findOne({lote}, (err, analisisDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        if(!analisisDB){
            res.json({empty:true})
        }else{
            res.json(analisisDB)
        }
    })
})


app.post('/api/analisis-tinta', (req, res)=>{
    
    let body = req.body;
    let final;
    // //console.log(body.lote)
    atinta.findOne({lote:body.lote}, (err, atintaDB)=>{
        if(err){
            //console.log(err)
        }
        if(!atintaDB){
            let analisis = new atinta(body).save((err, nuevoAnalisisDB)=>{
                if( err ){
                    console.log(err)
                    // return res.status(400).json({
                    //     ok:false,
                    //     err
                    // });
                }
                
                res.json(nuevoAnalisisDB)
            })
        }else{
            atinta.findByIdAndUpdate(atintaDB._id, body, (err, AnalisisDB)=>{
                if( err ){
                    return res.status(400).json({
                        ok:false,
                        err
                    });
                }

                res.json(AnalisisDB)

            })
        }
    })

})

app.get('/api/analisis-tinta/:lote', (req, res)=>{

    let lote = req.params.lote;

    atinta.findOne({lote}, (err, analisisDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        if(!analisisDB){
            res.json({empty:true})
        }else{
            res.json(analisisDB)
        }
    })
})

module.exports = app;