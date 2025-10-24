const express = require('express');
const app = express();

const Despacho = require('../database/models/despacho.model');
const Lote = require('../database/models/lotes.model');
const Devolucion = require('../database/models/devolucion.model');
const moment = require('moment');

app.get('/api/gastos/:desde/:hasta', (req, res)=>{

    let desde = req.params.desde
    let hasta = req.params.hasta
    let asignaciones = []

    
    desde = moment(desde,"yyyy-MM-DD").format('DD-MM-yyyy')
    hasta = moment(hasta,"yyyy-MM-DD").format('DD-MM-yyyy')

    Despacho.find({estado:'despachado'}, (err, Despachado)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        
        let Despachos = []
        for(let i=0;i<Despachado.length;i++){
            let date = moment(Despachado[i].fecha, 'DD-MM-yyyy').format('DD-MM-yyyy')
            
            if(moment(date, "DD-MM-yyyy") > moment(desde, "DD-MM-yyyy") && moment(date, "DD-MM-yyyy") < moment(hasta, "DD-MM-yyyy")){
                Despachos.push(Despachado[i])
            }

            if(i === Despachado.length -1){
                res.json(Despachos)
            }

        }


    })
})

app.post('/api/lote-fecha', (req, res)=>{
    let body = req.body;
    //console.log(body)

    Lote.find({orden:{$in:body.ordenes}})
        .populate('material.material')
        .exec((err, LotesDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // //console.log(LotesDB)
        let materiales_ = []
        for(let i=0;i<LotesDB.length;i++){
            for(let x=0;x<LotesDB[i].material.length;x++){
                let materi_al = LotesDB[i].material[x].material._id
                let cantidad = LotesDB[i].material[x].cantidad
                let index = materiales_.findIndex(x=> x.orden == LotesDB[i].orden && x.material._id == materi_al)
                if(index < 0){
                   materiales_.push({orden:LotesDB[i].orden, material:LotesDB[i].material[x].material, cantidad:Number(cantidad), devolucion:0})
                }else{
                    materiales_[index].cantidad = Number(materiales_[index].cantidad) + Number(cantidad)
                    materiales_[index].cantidad = (materiales_[index].cantidad).toFixed(2)
                }
            }
            if(i === LotesDB.length-1){
                res.json(materiales_)
            }
        }
    })
})

app.post('/api/devoluciones-fecha', (req, res)=>{
    let body = req.body;

    Devolucion.find({orden:{$in:body.ordenes}})
        .populate('filtrado.material')
        .exec((err, DevolucionDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        // //console.log(LotesDB)
        let _materiales_ = []
        for(let i=0;i<DevolucionDB.length;i++){
            for(let x=0;x<DevolucionDB[i].filtrado.length;x++){
                let materi_al = DevolucionDB[i].filtrado[x].material._id

                let cantidad = DevolucionDB[i].filtrado[x].cantidad
                let index = _materiales_.findIndex(x=> x.orden == DevolucionDB[i].orden && x.material._id == materi_al)
                if(index < 0){
                   _materiales_.push({orden:DevolucionDB[i].orden, material:DevolucionDB[i].filtrado[x].material, cantidad:Number(cantidad)})
                }else{
                    _materiales_[index].cantidad = Number(_materiales_[index].cantidad) + Number(cantidad)
                    _materiales_[index].cantidad = (_materiales_[index].cantidad).toFixed(2)
                }
            }
            if(i === DevolucionDB.length-1){
                res.json(_materiales_)
            }
        }
    })
})

module.exports = app;