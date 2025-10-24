const express = require('express');
const app = express();


const facturacion = require('../database/models/facturacion.model')
const ifacturacion = require('../database/models/ifacturacion.model')

const { reception, reception_, reception__, reception___ } = require('../middlewares/emails/nuevarecepcion.email')

app.post('/api/facturacion', (req, res)=>{
    let body = req.body;

    let fc = new facturacion(body).save((err, factura)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(factura)
    })
})

app.get('/api/facturacion', (req, res)=>{
    
    facturacion.find({status:{$ne:'FINALIZADA'}})
     .populate('proveedor')
     .populate('productos.material')
     .exec((err, facturas)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(facturas)
    })
})

app.put('/api/facturacion/:id', (req, res)=>{
    let body = req.body;
    let id = req.params.id
    facturacion.findByIdAndUpdate(id, body, (err, facturas)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(facturas)
    })
})

app.get('/api/notificar-recepcion', (req, res)=>{

    Nueva_recepcion2()
    res.json('done')
})


app.get('/api/notificacion-recepcion/:id', (req, res)=>{

    let id = req.params.id

    facturacion.findByIdAndUpdate(id, {status:'Notificado'}, (err, facturacion)=>{


        let data = ''

        for(let i=0;i<facturacion.totales.length;i++){

            data = data + `
            <tr>
                <td>${facturacion.totales[i].producto} (${facturacion.totales[i].marca})</td>
                <td>${facturacion.totales[i].lote}</td>
                <td>${facturacion.totales[i].total}</td>
            </tr>`

        }

        reception('nada','calcurianandres@gmail.com,  zuleima.vela@poligraficaindustrial.com',data,facturacion.factura)

        // for(let i=0;i<1;i++){
        //     //console.log(i)
        //         let random = Math.floor(Math.random() * (9999 - 1000 + 1) ) + 1000;
        //         // reception('nada','calcurianandres@gmail.com','motivo de prueba',random)
        // }
        res.json('done')
    })

})

app.get('/api/recepcion-porconfirmar/:info/:id', (req, res)=>{

    let info = req.params.info
    let id = req.params.id

    facturacion.findByIdAndUpdate(id, {status:'Por notificar'}, (err, facturacion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        reception_('nada','calcurianandres@gmail.com,  zuleima.vela@poligraficaindustrial.com',facturacion.factura,info)
        res.json('Se envió observación para su pronta correción')
    })

})

app.get('/api/recepcion-observacion/:id', (req, res)=>{

    let id = req.params.id

    facturacion.findByIdAndUpdate(id, {status:'En Observacion'}, (err, facturacion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        let data = ''

        for(let i=0;i<facturacion.totales.length;i++){

            data = data + `
            <tr>
                <td>${facturacion.totales[i].producto} (${facturacion.totales[i].marca})</td>
                <td>${facturacion.totales[i].lote}</td>
                <td>${facturacion.totales[i].total}</td>
            </tr>`

        }

        reception__('nada','calcurianandres@gmail.com,  zuleima.vela@poligraficaindustrial.com',data,facturacion.factura)
        res.json('done')
    })

})


app.get('/api/ifacturacion/', (req, res)=>{
     let id = 'factuacion'

    let iterator = new ifacturacion({_id:id}).save((err, ifacturacion)=>{
        //console.log(ifacturacion)
    })
})

app.get('/api/addifacturacion/', (req, res)=>{
    let id = 'factuacion'

    ifacturacion.findByIdAndUpdate({_id: 'factuacion'}, {$inc: {seq: 1}}, {new: true, upset:true}, (err, ifacturacion)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(ifacturacion.seq)
    })
})

app.get('/api/por-analizar', (req, res)=>{
    facturacion.find({status:'En Observacion'})
     .populate('proveedor')
     .populate('productos.material')
     .exec((err, facturas)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(facturas)
    })
})

app.get('/api/cerrar-facturacion/:id', (req, res)=>{

    let id = req.params.id;

    facturacion.findOne({_id:id}, (err, FacturacionDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        let finalizar = true;

        for(let i=0;i<FacturacionDB.totales.length;i++){
            if(!FacturacionDB.totales[i].resultado){
                finalizar = false;
            }
            if(i === FacturacionDB.totales.length -1){
                if(finalizar){
                    facturacion.findByIdAndUpdate(id, {status:'FINALIZADA'}, (err, finalizacion)=>{
                        
                        if( err ){
                            return res.status(400).json({
                                ok:false,
                                err
                                });
                        }
                        
                        res.json(finalizacion)
                    })
                }else{
                    res.json('done')
                }
            }
        }
    })

})

app.post('/api/enviar-notificacion', (req, res)=>{

    let body = req.body

    reception___(body.resultado,body.correos,body.observacion,body.lote,body.tabla)
    
    res.json('ok')
})


module.exports = app;