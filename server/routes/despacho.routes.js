const express = require('express');
const app = express();

var moment = require('moment'); // require

const Despacho = require('../database/models/despacho.model')
const Orden = require('../database/models/orden.model');
const Producto = require('../database/models/producto.model')
const gestion = require('../database/models/gestiones.model')

const { _despacho_ } = require('../middlewares/emails/despacho.email')

app.get('/api/despacho', (req, res) => {
    Despacho.find({ estado: 'pendiente' }, (err, DespachosDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json(DespachosDB)
    })
});

app.get('/api/despachos-cliente/:cliente/:desde/:hasta', async (req, res) => {
    try {
        // 🧾 Parámetros recibidos desde la URL
        let { cliente, desde, hasta } = req.params;

        console.log('Cliente:', cliente, 'Desde:', desde, 'Hasta:', hasta);

        // 📅 Normalizo formato de fechas (asegurando uso de YYYY-MM-DD correcto)
        const desdeMoment = moment(desde, "YYYY-MM-DD");
        const hastaMoment = moment(hasta, "YYYY-MM-DD");

        // 📦 Array para ir acumulando todos los despachos filtrados
        const Despachos__ = [];

        // 🧠 Busco todos los despachos (más adelante se podría optimizar con filtros de fecha global)
        const Despachado = await Despacho.find({}).lean().exec();

        console.log(`Total documentos de despacho encontrados: ${Despachado.length}`);

        // 🔁 Recorro cada documento principal
        for (const item of Despachado) {
            // Recorro cada subdocumento del array despacho
            for (const sub of item.despacho) {
                // 📅 Determino la fecha de referencia:
                // si existe "parcial", uso esa; si no, uso la fecha del documento padre.
                const fechaRef = sub.parcial ? sub.parcial : item.fecha;
                console.log(`Procesando OP: ${sub.op} con fecha de referencia: ${fechaRef}`);

                // Normalizo la fecha para comparación
                const fechaMoment = moment(fechaRef, "DD-MM-YYYY");
                console.log(`Fecha normalizada para OP ${sub.op}: ${fechaMoment.format("YYYY-MM-DD")}`);

                // ⏱️ Verifico si la fecha está dentro del rango solicitado
                if (fechaMoment.isSameOrAfter(desdeMoment) && fechaMoment.isSameOrBefore(hastaMoment)) {
                    console.log(`OP ${sub.op} está dentro del rango de fechas.`);
                    // 🔍 Busco la Orden relacionada por el campo "op"
                    const OrdenDB = await Orden.findOne({ sort: sub.op }).lean().exec();

                    // Si hay una Orden y pertenece al cliente indicado
                    console.log(`Orden encontrada para OP ${sub.op}:`, OrdenDB ? OrdenDB.producto.cliente : 'No encontrada');
                    if (OrdenDB && OrdenDB.producto.cliente === cliente) {
                        // ✅ Reutilizo el objeto sub y le asigno la fecha (para mostrar en frontend)
                        const subCopia = { ...sub };
                        subCopia.status = fechaRef;

                        // Lo agrego al resultado
                        Despachos__.push(subCopia);
                        console.log(`OP ${sub.op} agregada al resultado final.`, Despachos__.length);
                    }
                }
            }
        }

        // 📚 Ordeno los resultados finales por "documento" (orden alfabético)
        const despachosOrdenados = Despachos__.sort((a, b) => a.documento.localeCompare(b.documento));

        // 🚀 Devuelvo los datos al frontend (igual que antes)
        return res.json(despachosOrdenados);

    } catch (err) {
        // ⚠️ Cualquier error es capturado aquí
        console.error("Error en /api/despachos-cliente:", err);
        return res.status(500).json({ ok: false, err });
    }
});


app.get('/api/despachados', (req, res) => {
    Despacho.find({ estado: 'despachado' }, (err, Depachados) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        let despachados = []
        for (let i = 0; i < Depachados.length; i++) {
            for (let x = 0; x < Depachados[i].despacho.length; x++) {
                despachados.push(Depachados[i].despacho[x].op)
            }
        }

        res.json(despachados)
    })
})

app.get('/api/despacho-fechas/:desde/:hasta', (req, res) => {

    let desde = req.params.desde
    let hasta = req.params.hasta


    desde = moment(desde, "yyyy-MM-DD").format('DD-MM-yyyy')
    hasta = moment(hasta, "yyyy-MM-DD").format('DD-MM-yyyy')

    Despacho.find({}, (err, Despachado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        let Despachos = []
        for (let i = 0; i < Despachado.length; i++) {
            let date = moment(Despachado[i].fecha, 'DD-MM-yyyy').format('DD-MM-yyyy')

            if (moment(date, "DD-MM-yyyy") >= moment(desde, "DD-MM-yyyy") && moment(date, "DD-MM-yyyy") <= moment(hasta, "DD-MM-yyyy")) {
                Despachos.push(Despachado[i])
            }

            if (i === Despachado.length - 1) {

                res.json(Despachos)
            }

        }


    })
})

app.get('/api/despachados-todos', (req, res) => {
    Despacho.find({ estado: 'despachado' }, (err, Despachado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json(Despachado)

    })
})

app.get('/api/despachos-pendientes/:orden', (req, res) => {
    let orden = req.params.orden
    Despacho.find({ "despacho.op": orden }, (err, DespachoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json(DespachoDB)
    })
})

app.get('/api/despacho/:orden', (req, res) => {
    let orden = req.params.orden

    ////console.log(orden)

    Despacho.find({ "estado": "despachado", "despacho.op": orden }, (err, DespachoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json(DespachoDB)
    })
});

app.put('/api/despachos/:id', (req, res) => {
    let id = req.params.id;
    let body = req.body;

    Despacho.findByIdAndUpdate(id, body, (err, edicion) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json('ok')
    })
})

app.put('/api/despacho/:id', (req, res) => {
    let id = req.params.id;
    let body = req.body;
    let hoy = moment().format('DD-MM-yyyy')
    let limite = 0

    // ////console.log(body)

    let calculo = new Promise(function (menor, mayor) {
        for (let i = 0; i < body.despacho.length; i++) {

            Despacho.find({ 'despacho.op': body.despacho[i].op }, (err, despachos_) => {
                let cantidad = 0;
                for (let x = 0; x < despachos_.length; x++) {
                    let _despacho = despachos_[x].despacho.filter(x => x.op === body.despacho[i].op)

                    for (let y = 0; y < _despacho.length; y++) {
                        cantidad = cantidad + _despacho[y].cantidad
                    }

                    let fin = despachos_.length - 1;

                    if (x === fin) {
                        Orden.findOne({ sort: body.despacho[i].op }, (err, ordenDB) => {
                            let porcentaje = cantidad * 100 / ordenDB.cantidad
                            // if(porcentaje > 110){
                            //     limite  = body.despacho[i].op
                            //     // ////console.log(limite,'menor')
                            // }
                            if (i === body.despacho.length - 1) {
                                if (limite > 0) {
                                    menor('menor')
                                } else {
                                    mayor('mayor')
                                }
                            }
                        })
                    }


                }
            });
        }
    })

    calculo.then(
        function (value) { res.json({ orden: limite }); },
        function (error) {
            Despacho.findByIdAndUpdate(id, { estado: 'despachado', fecha: hoy, despacho: body.despacho }, (err, DespachosDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }
                res.json('ok')
            })
        }
    );
})

app.post('/api/despacho/almacen', (req, res) => {

    let producto = req.body.producto
    console.log(producto)

    Producto.findOne({ producto })
        .populate('cliente')
        .exec((err, cliente) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json({ almacenes: cliente.cliente.almacenes })
        });

});

app.post('/api/last-gestiones', async (req, res) => {
    const { op, cantidad } = req.body;

    try {
        // Buscar la última gestión por orden
        const ultima = await gestion.findOne({ op }).sort({ _id: -1 }).limit(1);

        if (!ultima) {
            return res.json({ cantidad: Number(cantidad) });
        }

        // Buscar todas las gestiones que tengan la misma máquina
        const gestiones_misma_maquina = await gestion.find({ maquina: ultima.maquina, orden: ultima.orden, op: ultima.op });

        // Sumar todas las hojas de esas gestiones
        const totalHojas = gestiones_misma_maquina.reduce((sum, g) => sum + (Number(g.hojas) || 0), 0);

        // Calcular el resultado
        const restante = totalHojas;

        res.json(restante);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al calcular gestiones' });
    }
});

app.post('/api/despacho', (req, res) => {
    let body = req.body;

    ////console.log(body)

    const NuevoDespacho = new Despacho({
        fecha: body.fecha,
        despacho: body.despacho,
        observacion: body.observacion
    })
    let data = '';
    let despacho_ = '';

    for (let i = 0; i < body.despacho.length; i++) {
        data = `<tr>
        <td>${body.despacho[i].op}</td>
        <td>${body.despacho[i].producto}</td>
        <td>${body.despacho[i].cantidad}</td>
        <td>${body.despacho[i].oc}</td>
        <td>${body.despacho[i].destino}</td>
        </tr>`
        despacho_ = despacho_ + data;
    }

    _despacho_(despacho_, body.fecha, 'jaime.davila@poligraficaindustrial.com,rusbeli.velazquez@poligraficaindustrial.com,enjimar.fajardo@poligraficaindustrial.com,raul.diaz@poligraficaindustrial.com, jaime.sanjuan@poligraficaindustrial.com, zuleima.vela@poligraficaindustrial.com,enida.aponte@poligraficaindustrial.com,carlos.mejias@poligraficaindustrial.com,zuleima.vela@poligraficaindustrial.com,freddy.burgos@poligraficaindustrial.com,yraida.baptista@poligraficaindustrial.com,attilio.granone@poligraficaindustrial.com,recepcion@poligraficaindustrial.com,contabilidad@poligraficaindustrial.com', body.observacion)

    NuevoDespacho.save((err, DespachoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json(DespachoDB)
    })
});

module.exports = app;