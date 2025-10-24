const express = require('express');
const app = express();

const Orden = require('../database/models/orden.model');
const Almacenado = require('../database/models/almacenado.model');
const Iasignacion = require('../database/models/iasignacion.modal')
const Lotes = require('../database/models/lotes.model')
const Requisicion = require('../database/models/requisicion.model')
const usuario = require('../database/models/usuarios.model');

const { FAL005 } = require('../middlewares/docs/FAL-005.pdf')

app.get('/api/orden-especifica', (req, res) => {

    Orden.find({ estado: 'Espera' })
        .populate('cliente')
        .populate('producto.grupo')
        .populate('producto.cliente')
        .populate('producto.materiales')
        .populate({ path: 'producto', populate: { path: 'materiales.producto' } })
        .populate({ path: 'producto.materiales.producto', populate: { path: 'grupo' } })
        .exec((err, orden) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            for (let x = 0; x < orden.length; x++) {
                for (let i = 0; i < orden[x].producto.materiales[orden[x].montaje].length; i++) {
                    let material = orden[x].producto.materiales[orden[x].montaje][i]
                    if (material.producto.grupo.nombre != 'Sustrato' && material.cantidad === '0') {
                        orden[x].producto.materiales[orden[x].montaje].splice(i, 1)
                        i--
                    }
                    if (x === orden.length - 1 && i === orden[x].producto.materiales[orden[x].montaje].length - 1) {
                        res.json(orden)
                    }

                }

            }
        })

})


app.post('/api/buscar-en-almacen', (req, res) => {

    let parametros = req.body

    Almacenado.find(parametros)
        .populate({
            path: 'material',
            populate: {
                path: 'grupo'
            }
        })
        .exec((err, almacen) => {
            res.json(almacen)
        })

})

app.get('/api/buscar-por-nombre', (req, res) => {

    Almacenado.find({ $and: [{ cantidad: { $gt: 0 } }, { cantidad: { $ne: '0.00' } }] })
        .populate({
            path: 'material',
            populate: {
                path: 'grupo'
            }
        })
        .exec((err, almacen) => {

            for (let i = 0; i < almacen.length; i++) {
                if (!almacen[i].material) {
                    almacen.splice(i, 1)
                    i--
                }

                if (i == almacen.length - 1) {
                    res.json(almacen)
                }

            }



        })
})

app.get('/api/buscar-cinta', (req, res) => {

    Almacenado.find({ $and: [{ cantidad: { $gt: 0 } }, { cantidad: { $ne: '0.00' } }] })
        .populate({
            path: 'material',
            populate: {
                path: 'grupo'
            }
        })
        .exec((err, almacen) => {

            let cinta = []

            for (let i = 0; i < almacen.length; i++) {
                if (!almacen[i].material) {
                    almacen.splice(i, 1)
                    i--
                } else {

                    if (almacen[i].material.grupo.nombre === 'Cinta de Embalaje') {
                        cinta.push(almacen[i])
                    }

                }

                if (i == almacen.length - 1) {
                    res.json(cinta)
                }

            }



        })
})

app.post('/api/descontar', async (req, res) => {
    try {
        // 📨 Recibimos el cuerpo de la petición
        const body = req.body;
        let N_asignacion;
        const lotes = [];
        let Requi = false;
        let email_limpieza = '';
        let email_requisicion = '';
        let usuario_ = 'Enida Aponte';

        // ✅ Si la petición viene de una requisición
        if (body.requi) {
            Requi = true;
            try {
                // 🔄 Actualizamos el estado de la requisición
                let requisicion = await Requisicion.findOneAndUpdate({ _id: body.orden_id }, { estado: 'Finalizado' });
                if (requisicion && requisicion.producto && requisicion.usuario) {
                    email_limpieza = requisicion.producto.producto;
                    let name = requisicion.usuario.split(' ');
                    // 👤 Armamos el nombre del usuario (solo si hay al menos dos palabras)
                    usuario_ = `${name[0] || ''} ${name[1] || ''}`;
                    let email = await usuario.findOne({ Nombre: name[0] }).exec();
                    // 📧 Validamos que el email exista
                    email_requisicion = email && email.Correo ? email.Correo : '';
                } else {
                    // ⚠️ Si la requisición no existe o está incompleta
                    return res.status(400).json({
                        ok: false,
                        err: 'Requisición no encontrada o incompleta'
                    });
                }
            } catch (err) {
                console.log(err);
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
        }

        // 🖨️ Mostramos el correo en consola
        console.log('correo:', email_requisicion);

        // 🔄 Actualizamos el estado de la orden
        await Orden.findOneAndUpdate({ sort: body.orden }, { estado: 'activo' });

        // 🔢 Incrementamos el contador de asignaciones
        const asig = await Iasignacion.findByIdAndUpdate(
            { _id: 'iterator' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true } // 🛠️ upsert corregido
        );
        // 🛡️ Validamos que asig exista
        N_asignacion = asig && asig.seq ? asig.seq : 0;

        // 🗃️ Validamos que los arreglos tengan la misma longitud
        const arrLen = body.ids.length;
        if ([body.restantes, body.producto, body.lotes, body.codigos, body.cantidad, body.EA_cantidad].some(arr => !Array.isArray(arr) || arr.length !== arrLen)) {
            return res.status(400).json({
                ok: false,
                err: 'Los arreglos del body no tienen la misma longitud o no son arreglos'
            });
        }

        // 🔄 Actualizamos cada almacenado y armamos los lotes usando Promise.all para optimizar
        await Promise.all(body.ids.map((id, i) => {
            // Validamos que los datos existan y sean correctos
            if (
                body.restantes[i] === undefined ||
                body.producto[i] === undefined ||
                body.lotes[i] === undefined ||
                body.codigos[i] === undefined ||
                body.cantidad[i] === undefined ||
                body.EA_cantidad[i] === undefined
            ) {
                // ⚠️ Si falta algún dato, lanzamos error
                throw new Error(`Datos faltantes en el índice ${i}`);
            }
            // Actualizamos el almacenado
            return Almacenado.updateOne({ _id: id }, { cantidad: body.restantes[i] })
                .then(() => {
                    // Armamos el lote
                    const lote = {
                        asignacion: N_asignacion,
                        material: body.producto[i],
                        lote: body.lotes[i],
                        codigo: body.codigos[i],
                        cantidad: Number(body.cantidad[i]).toFixed(2),
                        EA_cantidad: body.EA_cantidad[i]
                    };
                    lotes.push(lote);
                    // 📝 Log de cada lote actualizado
                    console.log(`lote:${body.lotes[i]} codigo:${body.codigos[i]} - EA:${body.EA_cantidad[i]} updated to ${body.restantes[i]}`);
                });
        }));

        // ⏳ Esperamos 1 segundo antes de registrar el lote y ejecutar FAL005
        setTimeout(() => {
            (async () => {
                try {
                    // 📦 Creamos el nuevo lote en la base de datos
                    const NewLote = {
                        asignacion: N_asignacion,
                        orden: body.orden,
                        material: lotes
                    };
                    const loteDB = await new Lotes(NewLote).save();
                    // 📄 Ejecutamos el proceso FAL005
                    FAL005(body.orden, N_asignacion, body.tabla, body.materiales, body.lotes, body.cantidades, Requi, email_limpieza, email_requisicion, usuario_);
                    // ✅ Respondemos al cliente
                    res.json('done');
                } catch (err) {
                    // ⚠️ Si ocurre un error en el setTimeout
                    res.status(400).json({
                        ok: false,
                        err: err.message || err
                    });
                }
            })();
        }, 1000);
    } catch (err) {
        // ⚠️ Error general del endpoint
        res.status(400).json({
            ok: false,
            err: err.message || err
        });
    }
});

module.exports = app;