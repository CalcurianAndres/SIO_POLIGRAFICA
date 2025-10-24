const express = require('express');
const app = express();
const Escala = require('../database/models/escala.model');
const Producto = require('../database/models/producto.model')
// const consultaDolar = require('consulta-dolar-venezuela');
const { pyDolarVenezuela } = require("consulta-dolar-venezuela");
const Despacho = require('../database/models/despacho.model');
const Orden = require('../database/models/orden.model');
const icotizacion = require('../database/models/icotizacion.model')
const axios = require('axios');


app.post('/api/cotizacion/intervalo', (req, res)=>{
    
    const body = req.body
    
    let Nueva_Escala = new Escala({
        producto:body.producto,
        cantidad:body.cantidad,
        descripcion:body.descripcion,
        montaje:body.montaje,
        escalas:body.escalas,
        precio:body.precio,
        cliente:body.cliente
    }).save((err, EscalaDB)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }

        res.json(EscalaDB)
    })

})

app.get('/api/cotizacion/intervalo-todos/:cliente', (req, res)=>{
    let cliente = req.params.cliente;

    Escala.find({cliente})
        .populate('producto')
        .sort('escalas.cantidad')
        .exec((err, Escalas)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(Escalas)
    })

})

app.get('/api/cotizacion/intervalo/:producto', (req, res)=>{
    let producto = req.params.producto;

    Escala.find({producto})
        .populate('producto')
        .exec((err, Escalas)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(Escalas)
    })

})

app.delete('/api/cotizacion/intervalo/:id', (req, res)=>{
    let id = req.params.id

    Escala.findByIdAndDelete(id, (err, Escala)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        res.json(Escala)
    })
})

app.put('/api/cotizacion/intervalos', (req, res)=>{
    let id = req.body._id
    let body = req.body

    //console.log(body)

    Escala.findOneAndUpdate({_id:id}, body,(err, Escala)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
                });
        }

        //console.log(Escala)
        res.json(Escala)

    })
})

app.post('/api/cotizacion/intervalo/producto/:producto', (req, res)=>{
    let producto = req.params.producto
    let cantidad = req.body.cantidad;
    let MonitorBCV
    
    
    
    Producto.findOne({producto}, (err, Producto)=>{
        if( err ){
            return res.status(400).json({
                ok:false,
                err
            });
        }
        
        Escala.find({producto:Producto._id,cantidad:{$lte: cantidad} }, (err, Escala)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }

            //console.log(Escala)
            
            
            consultaDolar.$monitor().then($=>{

                if(!$){
                    //console.log('err')
                }
                
                MonitorBCV = $['$bcv']
                res.json({Escala,MonitorBCV})
            }, error =>{
                //console.log('mensaje de prueba')
                // MonitorBCV = 0,00
                res.json({Escala,MonitorBCV})
            })

        })
    })
})

app.put('/api/facturado', async (req, res) => {
    try {
      const body = req.body;
      if (!body || !body._id || !body.documento) {
        return res.status(400).json({ ok: false, err: 'Faltan datos requeridos' });
      }
  
      // Convertir a ObjectId si es posible
      let targetId;
      try {
        targetId = mongoose.Types.ObjectId(body._id);
      } catch (e) {
        targetId = body._id;
      }
  
      const updated = await Despacho.findOneAndUpdate(
        { 'despacho._id': targetId },
        { $set: { 'despacho.$[elem].documento': body.documento } },
        { arrayFilters: [{ 'elem._id': targetId }], new: true }
      ).exec();
  
      if (!updated) {
        return res.status(404).json({ ok: false, err: 'Sub-despacho no encontrado' });
      }
  
      return res.json({ ok: true, mensaje: 'Documento actualizado correctamente' });
    } catch (err) {
      console.error('Error /api/facturado:', err);
      return res.status(500).json({ ok: false, err });
    }
  });


app.post('/api/incremento/pre', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body._id) {
      return res.status(400).json({ ok: false, err: 'Falta body._id' });
    }

    // intentar convertir a ObjectId, si no se puede usar el string (por seguridad)
    let targetId;
    try {
      targetId = mongoose.Types.ObjectId(body._id);
    } catch (e) {
      targetId = body._id;
    }

    // Traigo sólo el subdocumento que me interesa (proyección mínima -> muy rápido)
    const match = await Despacho.findOne(
      { 'despacho._id': targetId },
      { 'despacho.$': 1 }
    ).lean().exec();

    if (!match || !Array.isArray(match.despacho) || match.despacho.length === 0) {
      return res.status(404).json({ ok: false, err: 'Sub-despacho no encontrado' });
    }

    const sub = match.despacho[0];

    // comprobar que documento sea string y obtener su primera letra con seguridad
    const firstChar =
      typeof sub.documento === 'string' && sub.documento.length > 0
        ? sub.documento.charAt(0)
        : null;

    if (firstChar === 'N') {
      // rama "N": marcar status = 'NE' en el subdoc y push de una nueva entrada con status 'fac'
      const newEntry = { ...body };
      delete newEntry._id; // clonamos antes de eliminar
      newEntry.status = 'fac';

      // 1) actualizar el status del subdocumento
      const updatedSet = await Despacho.updateOne(
        { 'despacho._id': targetId },
        { $set: { 'despacho.$[elem].status': 'NE' } },
        { arrayFilters: [{ 'elem._id': targetId }] }
      ).exec();

    //   if (!updatedSet.matchedCount) {
    //     return res.status(500).json({ ok: false, err: 'No se pudo actualizar status (rama N)' });
    //   }

      // 2) hacer el push de la nueva entrada
      const updatedPush = await Despacho.updateOne(
        { 'despacho._id': targetId },
        { $push: { despacho: newEntry } }
      ).exec();

    //   if (!updatedPush.matchedCount) {
    //     return res.status(500).json({ ok: false, err: 'No se pudo insertar nueva entrada (rama N)' });
    //   }

    } else {
      // rama normal: actualizo solo los campos que vienen en body (evito sobreescribir otros campos)
      const setObj = {};
      if (body.tasa !== undefined) setObj['despacho.$[elem].tasa'] = body.tasa;
      if (body.precio !== undefined) setObj['despacho.$[elem].precio'] = body.precio;
      if (body.escala !== undefined) setObj['despacho.$[elem].escala'] = body.escala;
      if (body.cantidad !== undefined) setObj['despacho.$[elem].cantidad'] = body.cantidad;

      if (Object.keys(setObj).length === 0) {
        return res.status(400).json({ ok: false, err: 'No hay campos válidos para actualizar' });
      }

      const updated = await Despacho.findOneAndUpdate(
        { 'despacho._id': targetId },
        { $set: setObj },
        { arrayFilters: [{ 'elem._id': targetId }], new: true }
      ).exec();

      if (!updated) {
        return res.status(500).json({ ok: false, err: 'No se pudo actualizar (rama normal)' });
      }
    }

    // Incremento seguro del iterator *después* de haber confirmado la actualización anterior
    const devolucion = await icotizacion.findOneAndUpdate(
      { _id: 'iterator' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).exec();

    if (!devolucion) {
      return res.status(500).json({ ok: false, err: 'No se pudo incrementar iterator' });
    }

    return res.json(devolucion.seq);
  } catch (err) {
    console.error('Error /api/incremento/pre:', err);
    return res.status(500).json({ ok: false, err });
  }
});

  


app.get('/api/despachos/pre-facturacion', async (req, res) => {
    try {
        let preFacuracion = [];

        // Buscar despachos filtrando
        const despachos = await Despacho.find({
            $and: [
                { $or: [{ estado: 'pendiente' }, { 'despacho.documento': /^N/ }] },
                { fecha: { $not: /(2023|2024)/ } }
            ]
        });

        // Procesar todos los despachos en paralelo
        await Promise.all(
            despachos.map(async (despacho) => {
                await Promise.all(
                    despacho.despacho.map(async (subDespacho) => {
                        // Buscar la orden
                        const ordensDB = await Orden.findOne({ sort: subDespacho.op })
                            .populate('cliente')
                            .populate('producto.grupo')
                            .populate('producto.cliente')
                            .populate('producto.materiales')
                            .populate({ path: 'producto', populate: { path: 'materiales.producto' } })
                            .populate({ path: 'producto.materiales.producto', populate: { path: 'grupo' } })
                            .exec();

                        if (!ordensDB) return;

                        // Buscar el producto
                        const ProductoDB = await Producto.findOne({
                            producto: ordensDB.producto.producto,
                            version: ordensDB.producto.version,
                            edicion: ordensDB.producto.edicion
                        }).exec();

                        if (!ProductoDB) {
                            console.log('error aqui con orden:',subDespacho.op);
                            return;
                        }

                        // Buscar la escala
                        const EscalaDB = await Escala.findOne({ producto: ProductoDB._id }).exec();

                        preFacuracion.push({
                            fecha: despacho.fecha,
                            despacho: subDespacho,
                            orden: ordensDB,
                            escala: EscalaDB
                        });
                    })
                );
            })
        );

        // Consultar precio del dólar
        let MonitorBCV = 0.00;
        try {
            const response = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
            console.log('Promedio dolar hoy: ',response.data.promedio)
            MonitorBCV = response.data.promedio || 0;
        } catch (error) {
            console.error(error);
        }

        res.json({ preFacuracion, MonitorBCV });

    } catch (err) {
        res.status(400).json({ ok: false, err });
    }
});

module.exports = app;