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
const moment = require('moment');


app.post('/api/cotizacion/intervalo', (req, res) => {

  const body = req.body

  let Nueva_Escala = new Escala({
    producto: body.producto,
    cantidad: body.cantidad,
    descripcion: body.descripcion,
    montaje: body.montaje,
    escalas: body.escalas,
    precio: body.precio,
    cliente: body.cliente
  }).save((err, EscalaDB) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      });
    }

    res.json(EscalaDB)
  })

})

app.get('/api/cotizacion/intervalo-todos/:cliente', (req, res) => {
  let cliente = req.params.cliente;

  Escala.find({ cliente })
    .populate('producto')
    .sort('escalas.cantidad')
    .exec((err, Escalas) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        });
      }

      res.json(Escalas)
    })

})

app.get('/api/cotizacion/intervalo/:producto', (req, res) => {
  let producto = req.params.producto;

  Escala.find({ producto })
    .populate('producto')
    .exec((err, Escalas) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        });
      }

      res.json(Escalas)
    })

})

app.delete('/api/cotizacion/intervalo/:id', (req, res) => {
  let id = req.params.id

  Escala.findByIdAndDelete(id, (err, Escala) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      });
    }

    res.json(Escala)
  })
})

app.put('/api/cotizacion/intervalos', (req, res) => {
  let id = req.body._id
  let body = req.body

  //console.log(body)

  Escala.findOneAndUpdate({ _id: id }, body, (err, Escala) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      });
    }

    //console.log(Escala)
    res.json(Escala)

  })
})

app.post('/api/cotizacion/intervalo/producto/:producto', (req, res) => {
  let producto = req.params.producto
  let cantidad = req.body.cantidad;
  let MonitorBCV



  Producto.findOne({ producto }, (err, Producto) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      });
    }

    Escala.find({ producto: Producto._id, cantidad: { $lte: cantidad } }, (err, Escala) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        });
      }

      //console.log(Escala)


      consultaDolar.$monitor().then($ => {

        if (!$) {
          //console.log('err')
        }

        MonitorBCV = $['$bcv']
        res.json({ Escala, MonitorBCV })
      }, error => {
        //console.log('mensaje de prueba')
        // MonitorBCV = 0,00
        res.json({ Escala, MonitorBCV })
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
      // 🚫 Si no llega el _id, no se puede continuar
      return res.status(400).json({ ok: false, err: 'Falta body._id' });
    }

    // 🧱 Intento convertir el id a ObjectId (por seguridad y compatibilidad)
    let targetId;
    try {
      targetId = mongoose.Types.ObjectId(body._id);
    } catch (e) {
      targetId = body._id;
    }

    // 🎯 Busco el subdocumento dentro del array despacho que tenga ese _id
    const match = await Despacho.findOne(
      { 'despacho._id': targetId },
      { 'despacho.$': 1 } // solo traigo el elemento que coincide, súper eficiente
    ).lean().exec();

    if (!match || !Array.isArray(match.despacho) || match.despacho.length === 0) {
      // 😕 No se encontró el subdocumento con ese _id
      return res.status(404).json({ ok: false, err: 'Sub-despacho no encontrado' });
    }

    const sub = match.despacho[0];

    // 🔤 Tomo la primera letra del campo documento (por si necesito decidir lógica según eso)
    const firstChar =
      typeof sub.documento === 'string' && sub.documento.length > 0
        ? sub.documento.charAt(0)
        : null;

    // 🧩 Si el documento comienza con 'N' (Nota, pre-doc, etc)
    if (firstChar === 'N') {
      // 🧬 Clono el body para generar una nueva entrada (la futura factura)
      const newEntry = { ...body };
      delete newEntry._id; // elimino el _id para que Mongo genere uno nuevo
      newEntry.status = 'fac'; // 🔄 nuevo estado = factura
      newEntry.parcial = moment().format('DD-MM-YYYY'); // 🗓 fecha de creación del nuevo

      // 📝 Actualizo el subdocumento original, marcándolo como "NE" (nota entregada o similar)
      const updatedSet = await Despacho.updateOne(
        { 'despacho._id': targetId },
        { $set: { 'despacho.$[elem].status': 'NE' } },
        { arrayFilters: [{ 'elem._id': targetId }] }
      ).exec();

      // ➕ Inserto el nuevo subdocumento (la factura clonada)
      const updatedPush = await Despacho.updateOne(
        { 'despacho._id': targetId },
        { $push: { despacho: newEntry } }
      ).exec();

    } else {
      // ⚙️ Rama normal: solo actualizo los campos específicos que llegan en el body
      const setObj = {};
      if (body.tasa !== undefined) setObj['despacho.$[elem].tasa'] = body.tasa;
      if (body.precio !== undefined) setObj['despacho.$[elem].precio'] = body.precio;
      if (body.escala !== undefined) setObj['despacho.$[elem].escala'] = body.escala;
      if (body.cantidad !== undefined) setObj['despacho.$[elem].cantidad'] = body.cantidad;

      if (Object.keys(setObj).length === 0) {
        // 🚫 No hay nada que actualizar
        return res.status(400).json({ ok: false, err: 'No hay campos válidos para actualizar' });
      }

      // 🧱 Actualizo solo los campos válidos
      const updated = await Despacho.findOneAndUpdate(
        { 'despacho._id': targetId },
        { $set: setObj },
        { arrayFilters: [{ 'elem._id': targetId }], new: true }
      ).exec();

      if (!updated) {
        // 💥 Algo salió mal al intentar actualizar
        return res.status(500).json({ ok: false, err: 'No se pudo actualizar (rama normal)' });
      }
    }

    // 🔢 Incremento del contador global (iterator) después de todo el proceso
    const devolucion = await icotizacion.findOneAndUpdate(
      { _id: 'iterator' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).exec();

    if (!devolucion) {
      // ❌ No se pudo incrementar el contador
      return res.status(500).json({ ok: false, err: 'No se pudo incrementar iterator' });
    }

    // 🎉 Todo OK, devuelvo el número de secuencia actualizado
    return res.json(devolucion.seq);

  } catch (err) {
    // ⚠️ Error general del endpoint
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
              console.log('error aqui con orden:', subDespacho.op);
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




    // 2. CORRECCIÓN DE LA TASA
    let MonitorBCV = 0.00;
    try {
      // Usamos la URL de BCV directamente que es más estable y gratuita
      const response = await axios.get('https://ve.dolarapi.com/v1/dolares');

      // Esta URL devuelve UN solo objeto, no un array
      if (response.data[0] && response.data[0].promedio) {
        MonitorBCV = response.data[0].promedio;
      }

      console.log('Promedio dolar hoy (BCV): ', MonitorBCV);

    } catch (error) {
      console.error("Error al consultar la API:", error.message);
      // Opcional: Si falla el BCV, puedes intentar con el paralelo
    }

    res.json({ preFacuracion, MonitorBCV });

  } catch (err) {
    res.status(400).json({ ok: false, err });
  }
});

module.exports = app;