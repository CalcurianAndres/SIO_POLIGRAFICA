const express = require('express');

const Material = require('../database/models/material.model');
const Materia = require('../database/models/mp.model');
const Sustrato = require('../database/models/sustrato.model');
const Orden = require('../database/models/orden.model');
const Descuentos = require('../database/models/descuentos.model');
const Ingresos = require('../database/models/ingresos.model');
const Almacenado = require('../database/models/almacenado.model');
const Requisicion = require('../database/models/requisicion.model');
const Lote = require('../database/models/lotes.model');
const idevolucion = require('../database/models/idevolucion.model');
const Devolucion = require('../database/models/devolucion.model');
const lote = require('../database/models/lotes.model');
const Despacho = require('../database/models/despacho.model')
const almacenadoExterno = require('../database/models/almacenadoExterno');
const traslados = require('../database/models/traslados.model');

const moment = require('moment');


// NUEVA BASE
const Materiales = require('../database/models/materiales.model')

const { FAL005 } = require('../middlewares/docs/FAL-005.pdf');
const { FAL006 } = require('../middlewares/docs/FAL-006.pdf');

const { SolicitarRequisicion } = require('../middlewares/emails/solicitudMaterial.email')
const { FAL004 } = require('../middlewares/docs/FAL-004.pdf');
const { NotaSalida } = require('../middlewares/docs/traslado.pdf');
const { NuevoTraslado } = require('../middlewares/emails/traslados.email')
const app = express();

app.get('/api/lotes/:orden', (req, res) => {
    let orden = req.params.orden;

    Lote.find({ orden: orden })
        .populate('material.material')
        .exec((err, lotes) => {
            ////console.log(lotes)
            res.json(lotes)
        })
})

app.post('/api/almacenado', (req, res) => {

    let body = req.body;
    let existencia = []

    Almacenado.find({ lote: body.lote, codigo: body.codigo }, (err, existe) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (existe.length < 1) {
            const NewAlmacenado = new Almacenado(
                {
                    material: body.material,
                    codigo: body.codigo,
                    lote: body.lote,
                    cantidad: body.cantidad,
                    pedido: body.pedido,
                    precio: body.precio,
                    fuera: body.fuera
                }
            )

            NewAlmacenado.save((err, almacenDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }

                if (almacenDB.fuera) {

                    const NewAlmacenExterno = new almacenadoExterno(
                        {
                            material: body.material,
                            codigo: body.codigo,
                            lote: body.lote,
                            cantidad: body.cantidad,
                            pedido: body.pedido,
                            precio: body.precio,
                            almacen: "Wil Projects, C.A."
                        }
                    )

                    NewAlmacenExterno.save((err, almacenEDB) => {
                        if (err) {
                            console.log('Error almacen externo', err)
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            almacen: almacenDB
                        })
                    })

                } else {
                    res.json({
                        almacen: almacenDB
                    })
                }

            })
        } else {

            err = { mensaje: 'Este N° de Lote, junto a este código ya se encuentra registrado en Sio. Es necesario que cada producto almacenado sea unico en el sistema.' }
            return res.status(400).json({
                ok: false,
                err
            });
            //console.log('si')
        }
    })

});


app.get('/api/material-reporte', async (req, res) => {
    try {
        const grupo = '61fd54e2d9115415a4416f17'; // Manteniendo el grupo por si se requiere
        const fechaFiltro = '19-12-2024';
        despachosUnicos = new Set();


        // Convierte las fechas desde req.query a strings en formato dd-mm-yyyy
        const desde = moment(req.query.desde, 'YYYY-MM-DD');
        const hasta = moment(req.query.hasta, 'YYYY-MM-DD');

        // Busca los despachos y filtra manualmente las fechas
        const despachos_ = await Despacho.find({
            fecha: { $exists: true } // Asegurarte de que haya un campo de fecha
        }).lean(); // lean() para trabajar con objetos simples

        // Filtra los resultados comparando las fechas como strings
        let despachos = [];
        const despachosFiltered = despachos_.filter(despacho => {
            const fecha = moment(despacho.fecha, 'DD-MM-YYYY');
            return fecha >= desde && fecha <= hasta;
        });

        // 🔥 Aquí limpiamos el array de cada despacho
        despachosFiltered.forEach(despacho => {
            if (!despachosUnicos.has(despacho._id)) {
                despachosUnicos.add(despacho._id);

                // Filtra el array de "despacho" interno
                if (Array.isArray(despacho.despacho)) {
                    despacho.despacho = despacho.despacho.filter(d =>
                        d.documento && d.documento.startsWith('F')
                    );
                }

                despachos.push(despacho);
            }
        });
        // // Buscar despachos con las fechas dadas como strings
        // const despachos = await Despacho.find({ 
        //     fecha: { $gte: desde, $lte: hasta }
        // });

        console.log("Despachos encontrados:", despachos);


        // Crear arrays para almacenar asignaciones y devoluciones
        const asignaciones = [];
        const devoluciones = [];
        const devoluciones_2 = [];
        const ordenes = [];
        const parciales = []

        // Crear un Set para almacenar los números de orden únicos
        const ordenesUnicas = new Set();
        const DevUniques = new Set();
        const UniqueParcial = new Set();

        // Iterar sobre los despachos y buscar lotes asociados
        for (const despacho of despachos) {
            for (const op of despacho.despacho) { // Se asume que `despacho` es un array


                // Buscar asignaciones relacionadas
                const loteAsignaciones = await lote.find({ orden: op.op }).populate({
                    path: 'material.material',
                    populate: {
                        path: 'grupo'
                    }
                });

                // Filtrar y agregar a asignaciones solo las asignaciones con números de orden únicos
                loteAsignaciones.forEach(asignacion => {
                    if (!ordenesUnicas.has(asignacion.asignacion)) {
                        ordenesUnicas.add(asignacion.asignacion);
                        asignaciones.push(asignacion);
                    }
                });

                // Filtrar devoluciones relacionadas con los materiales de las asignaciones
                const devolucionesFiltradas = await Devolucion.find({ orden: op.op, status: 'Culminado' }).populate({
                    path: 'filtrado.material',
                    populate: {
                        path: 'grupo'
                    }
                });

                console.log(devolucionesFiltradas)

                devolucionesFiltradas.forEach(devolucion => {
                    if (!DevUniques.has(devolucion._id.toString())) {
                        DevUniques.add(devolucion._id.toString());
                        devoluciones_2.push(devolucion);
                    }
                })

                //buscarOrdenes relacionadas con estos despachos
                const orden = await Orden.find({ sort: op.op });
                ordenes.push(...orden)

                if (op.parcial_ != true) {
                    const parciales_previos = await Despacho.find({ 'despacho.op': op.op });

                    parciales_previos.forEach(parcial => {
                        if (!UniqueParcial.has(parcial._id.toString())) {
                            UniqueParcial.add(parcial._id.toString());
                            // Filtra el array de "despacho" interno
                            if (Array.isArray(parcial.despacho)) {
                                parcial.despacho = parcial.despacho.filter(d =>
                                    d.documento && d.documento.startsWith('F')
                                );
                            }
                            parciales.push(parcial);

                        }
                    })
                }
            }
        }

        // Responder con los datos una vez finalizado el proceso
        res.json({
            ok: true,
            despachos,
            asignaciones,
            devoluciones: devoluciones_2,
            ordenes,
            parciales
        });
    } catch (err) {
        // Manejo de errores
        res.status(400).json({
            ok: false,
            error: err.message || err,
        });
    }
});


app.get('/api/almacenados/:id', (req, res) => {

    const id = req.params.id;
    let almacenado = []

    // //console.log(id,'ooook')

    Material.findById(id, (err, materialDBB) => {
        if (materialDBB.presentacion === 'Caja') {
            Material.find({ presentacion: 'Caja', nombre: materialDBB.nombre }, (err, cajas) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }

                //console.log(cajas)
                res.json(cajas)
                //     for(let i=0;i<cajas.length;i++){
                //         Almacenado.find({material:cajas[i]._id})
                //              .populate({
                //                path: 'material',
                //                populate: {
                //                path: 'grupo'
                //                  }
                //              })
                //             .exec((err, Almacen)=>{
                //     if( err ){
                //         return res.status(400).json({
                //             ok:false,
                //             err
                //         });
                //     }

                //     if(Almacen[0]){
                //         almacenado.push(Almacen[0])
                //         //console.log(almacenado)
                //     }
                //     if(i == cajas.length -1){
                //         //console.log(almacenado)
                //         res.json(almacenado)
                //     }
                // })


                //     }

            })
        } else {
            Almacenado.find({ material: id })
                .populate({
                    path: 'material',
                    populate: {
                        path: 'grupo'
                    }
                })
                .exec((err, Almacen) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    //console.log(Almacen)
                    res.json(Almacen)

                })
        }
    })



});

app.get('/api/almacenado/:id', (req, res) => {

    const id = req.params.id;

    //console.log(id)

    Almacenado.findOne({ _id: id })
        .populate({
            path: 'material',
            populate: {
                path: 'grupo'
            }
        })
        .exec((err, Almacen) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            // //console.log(Almacen)
            res.json(Almacen)
        })

});

app.put('/api/almacenado/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body;

    Almacenado.findByIdAndUpdate(id, body)
        .exec((err, AlmacenadoDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json(AlmacenadoDB)
        })

})

app.get('/api/almacenados/:id/:cantidad', (req, res) => {
    const id = req.params.id;
    const cantidad = req.params.cantidad
    const body = req.body;
    let total = 0;

    Almacenado.find({ material: id, cantidad: { $gt: 0 } }, (err, almacenado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        for (let i = 0; i < almacenado.length; i++) {
            total = total + Number(almacenado[i].cantidad)
            if (cantidad > total) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'se supero cantidad'
                });
            }

        }

        res.json('listo')
    })

})

app.get('/api/almacenado', (req, res) => {

    const options = { sort: ['material.nombre'] };

    Almacenado.find({
        $and: [{ cantidad: { $gt: 0 } },
        { cantidad: { $ne: '0.00' } },
        { fuera: { $ne: true } }]
    })
        .populate({
            path: 'material',
            populate: {
                path: 'grupo'
            }
        })
        .exec((err, Almacen) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json(Almacen)
        })
})

app.get('/api/almacenado-final', (req, res) => {
    const hoy = new Date();
    const hace3Meses = new Date();
    hace3Meses.setMonth(hoy.getMonth() - 3);

    Almacenado.find({
        $and: [
            { fuera: { $ne: true } },
            { fecha: { $gte: hace3Meses } } // 👈 filtro últimos 3 meses
        ]
    })
        .populate({
            path: 'material',
            populate: { path: 'grupo' }
        })
        .exec((err, almacenados) => {
            if (err) {
                return res.status(400).json({ ok: false, err });
            }

            // 👇 construimos materiales con precio incluido
            const materiales = almacenados
                .filter(a => a.material != null)
                .map(a => {
                    return {
                        ...a.material.toObject?.() || a.material, // material completo
                        precio: a.precio                          // 👈 agregamos el precio
                    };
                });

            res.json(materiales);
        });
});


//VER TODOS LOS MATERIALES EXISTENTES
app.get('/api/tipo-materia-prima', (req, res) => {
    Materia.find((err, Grupos) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json(Grupos);
    });
});


app.get('/api/materiales', async (req, res) => {
    try {
        // Buscar materiales
        let materialesDB = await Material.find({
            eliminado: false,
            // nombre: { $not: /\*$/ } // No termina en asterisco
        })
            .populate('grupo')
            .sort('grupo.nombre')
            .sort('nombre')
            .exec();

        // Recorrer cada material y buscar último precio distinto de 0
        for (let material of materialesDB) {
            let ultimoRegistro = await Almacenado.findOne({
                "material": material._id,
                "precio": { $ne: 0 }
            })
                .sort({ fecha: -1 }) // Suponiendo que tienes un campo 'fecha' o 'createdAt'
                .exec();

            // Agregar propiedad 'ultimoPrecio' al material
            material = material.toObject(); // Para poder añadir keys sin problemas
            material.ultimoPrecio = ultimoRegistro ? ultimoRegistro.precio : 0;

            // Reemplazar en el array
            materialesDB[materialesDB.findIndex(m => m._id.equals(material._id))] = material;
        }

        res.json({
            ok: true,
            materiales: materialesDB
        });

    } catch (err) {
        res.status(400).json({
            ok: false,
            err
        });
    }
});



app.get('/api/materiales-new', (req, res) => {

    Materiales.find({ eliminado: false })
        .populate('grupo')
        .sort('grupo.nombre')
        .sort('nombre')
        .exec((err, materialesDB) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            // let Sin_Grupo = materialesDB.filter(m => m.grupo.nombre == undefined)

            res.json({
                ok: true,
                materiales: materialesDB
            })
        })

});

app.get('/api/materiales/:id', (req, res) => {

    let id = req.params.id

    Material.findById(id)
        .populate('grupo')
        .exec((err, materialesDB) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json(materialesDB)
        })

});

//AGREGAR NUEVO MATERIAL
app.post('/api/nuevo-material', async (req, res) => {

    let body = req.body;
    let ready = false;

    function definirGrupo() {
        return new Promise(resolve => {
            if (body.nuevo) {
                let NuevoGrupo = new Materia({
                    nombre: body.grupo
                })

                NuevoGrupo.save((err, grupoDB) => {

                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    body.grupo = grupoDB._id;
                    resolve(body.grupo)
                })
            } else {
                if (body.grupo == 'sustrato') {
                    let newSustrato = new Sustrato({
                        cantidad: body.cantidad,
                        material: body.producto
                    }).save((err, sustrato) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }

                        return res.json(sustrato);
                    })
                } else {
                    resolve(body.grupo)
                }
            }
        })
    }



    const material = new Material({
        grupo: await definirGrupo(),
        nombre: body.producto,
        marca: body.marca,
        ancho: body.ancho,
        largo: body.largo,
        gramaje: body.gramaje,
        calibre: body.calibre,
        cantidad: body.cantidad,
        unidad: body.unidad,
        presentacion: body.presentacion,
        color: body.color,
        neto: body.neto,
        cinta: body.cinta,

    });

    material.save((err, materialDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        const NewIngreso = new Ingresos({
            material: materialDB._id
        }).save((err, IngresoNuevo) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                material: IngresoNuevo
            })
        })


    });

});

//MODIFICAR UN MATERIAL
app.put('/api/material/:id', (req, res) => {

    const id = req.params.id;
    let body = req.body;

    Material.findByIdAndUpdate(id, body, (err, materialDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json('exito')
    })
})

app.put('/api/materiales/:id', (req, res) => {

    const id = req.params.id;
    let body = req.body;

    Material.updateMany(body.info, body.data, (err, materialDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json('exito')
    })
})

//ELIMINAR MATERIAL
app.delete('/api/material/:id', (req, res) => {

    const id = req.params.id;

    Material.findByIdAndUpdate(id, { activo: false }, (err, modificacion) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            material: modificacion
        })
    })
})

app.post('/api/material/devolucion', (req, res) => {

    let body = req.body;
    // //console.log(body)
    let tabla = '';


    let lotes = []
    let materiales = []
    let cantidades = []
    let final = body.filtrado.length - 1;
    for (let i = 0; i < body.filtrado.length; i++) {
        lotes.push(body.filtrado[i].lote)
        Material.findById(body.filtrado[i].material, (err, material) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            // ////console.log(material.nombre)
            let data = '';
            cantidades.push(`${body.filtrado[i].cantidad} ${material.unidad}`)
            if (!material.ancho) {
                if (material.grupo == '61fd54e2d9115415a4416f17' || material.grupo == '61fd6300d9115415a4416f60') {
                    materiales.push(`${material.nombre} (${material.marca}) - Lata:${body.filtrado[i].codigo}`)
                    data = `<tr><td>${material.nombre} (${material.marca}) - Lata:${body.filtrado[i].codigo}</td>
                <td>${body.filtrado[i].cantidad} ${material.unidad}</td></tr>`;
                } else {
                    materiales.push(`${material.nombre} (${material.marca})`)
                    data = `<tr><td>${material.nombre} (${material.marca})</td>
                <td>${body.filtrado[i].cantidad} ${material.unidad}</td></tr>`;
                }
            } else {
                materiales.push(`${material.nombre} ${material.ancho}x${material.largo} (${material.marca}) - Paleta:${body.filtrado[i].codigo}`)
                data = `<tr><td>${material.nombre} ${material.ancho}x${material.largo} (${material.marca}) - Paleta:${body.filtrado[i].codigo}</td>
            <td>${body.filtrado[i].cantidad} ${material.unidad}</td></tr>`;
            }

            tabla = tabla + data;
            if (i === final) {

                let newDEvolucion = new Devolucion({
                    orden: body.orden,
                    filtrado: body.filtrado,
                    motivo: body.motivo,
                    usuario: body.usuario
                }).save();
                res.json('done');

            }

        })

    }


})

app.get('/api/reenvio-requisicion/:id', (req, res) => {
    let id = req.params.id

    let tabla = '';

    Requisicion.findByIdAndUpdate(id, { estado: 'Finalizado' })
        .populate('producto.materiales.producto')
        .populate({ path: 'producto', populate: { path: 'materiales.producto', populate: { path: 'grupo' } } })
        .exec((err, requi) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }


            let material = []
            let cantidad = []
            let producto_ = requi.producto.materiales[0];

            // ////console.log(producto_, 'aja')

            for (let i = 0; i < producto_.length; i++) {
                let nombre = `${producto_[i].producto.nombre} (${producto_[i].producto.marca})`;
                let cant = `${producto_[i].cantidad} ${producto_[i].producto.unidad}`;
                if (producto_[i].producto.ancho) {
                    nombre = `${producto_[i].producto.nombre} ${producto_[i].producto.ancho}x${producto_[i].producto.largo} (${producto_[i].producto.marca}) Calibre: ${producto_[i].producto.calibre}, Gramaje: ${producto_[i].producto.gramaje}`;
                }
                material.push(nombre);
                cantidad.push(cant)
                if (nombre != undefined) {
                    let data = `<tr><td>${nombre}</td><td>${cant}</td></tr>`;
                    tabla = tabla + data;
                }

                let final = producto_.length - 1;
                if (i == final) {
                    console.log(final)
                    FAL004(requi.producto.producto, requi.sort, 2203, material, cantidad, requi.usuario, requi.motivo, tabla, 'calcurianandres@gmail.com')
                }
            }

            // ////console.log(requi.producto.materiales[0][0].producto)


            res.json(requi)
        })
})
app.get('/api/reenvio/:lote', (req, res) => {


    let Lotes_ = '';
    let names;
    // //console.log(body.lotes);
    let x = 0;

    let materiales = [];
    let lotes = [];
    let solicitados = [];

    let orden = []
    let material__ = []

    let Requi = false;

    let id = req.params.lote
    Lote.findById(id, (err, LoteDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        for (let i = 0; i < LoteDB.material.length; i++) {
            // //console.log('x')
            Almacenado.findOne({ material: LoteDB.material[i].material, LoteDB: LoteDB.material[i].LoteDB, codigo: LoteDB.material[i].codigo })
                .populate({
                    path: 'material',
                    populate: {
                        path: 'grupo'
                    }
                })
                .exec((err, MaterialDB) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    Material.findById(MaterialDB.material, (err, material) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }

                        names = `${material.nombre} (${material.marca})`;
                        if (material.ancho) {
                            names = `${material.nombre} ${material.ancho} x ${material.largo} (${material.marca}) - Paleta: ${LoteDB.material[i].codigo}`;
                        }
                        if (material.grupo == "61fd54e2d9115415a4416f17" || material.grupo == "61fd6300d9115415a4416f60") {
                            names = `${material.nombre} (${material.marca}) - Lata: ${LoteDB.material[i].codigo}`;
                        }
                        if (material.grupo == "61fd72ecd9115415a4416f68") {
                            names = `${material.nombre} (${material.marca}) - Cuñete: ${LoteDB.material[i].codigo}`;
                        }



                        materiales[i] = names;
                        //  //console.log(materiales)
                        lotes[i] = LoteDB.material[i].lote;
                        // LoteDB.materials.push(body.LoteDB.materials[i].LoteDB.material)
                        //  //console.log(LoteDB.materials)
                        solicitados[i] = `${material.unidad} - ${LoteDB.material[i].cantidad} ${material.unidad}`;
                        if (material.unidad == 'Und') {
                            LoteDB.material[i].cantidad = Math.ceil(LoteDB.material[i].cantidad);
                        }
                        if (material.unidad === "PALETA" || material.unidad === "Paleta") {
                            solicitados[i] = `${LoteDB.material[i].solicitado} Und`
                            // solicitados.push(`${LoteDB.material[i].solicitado} Und - ${material.neto}${material.unidad}`)
                            // material.unidad = 'Und'
                        } else {
                            if (material.grupo == "61fd54e2d9115415a4416f17" || material.grupo == "61fd6300d9115415a4416f60" || material.grupo == "61fd72ecd9115415a4416f68") {
                                solicitados[i] = `${material.unidad} - ${LoteDB.material[i].cantidad} ${material.unidad}`
                                LoteDB.material[i].solicitado = LoteDB.material[i].EA_Cantidad
                                // //console.log(body.LoteDBs[i].EA_Cantidad)
                            } else {
                                solicitados[i] = `${material.unidad} - ${LoteDB.material[i].cantidad} ${material.unidad}`
                            }
                        }
                        x++



                        data = `<tr><td>${names}</td>
                        <td>${LoteDB.material[i].lote}</td>
                        <td>${material.unidad} - ${LoteDB.material[i].cantidad} ${material.unidad}</td></tr>`
                        Lotes_ = Lotes_ + data;


                        let final = LoteDB.material.length;
                        if (materiales.length == LoteDB.material.length && LoteDB.material.length == LoteDB.material.length && solicitados.length == LoteDB.material.length) {

                            if (x == final) {

                                FAL005(LoteDB.orden, LoteDB.asignacion, Lotes_, materiales, lotes, solicitados, Requi)
                                res.json('ok')

                                // res.send(lotes_)
                            }

                            // //console.log(materiales,'_' ,lotes)

                        }
                    })



                })
        }

    })
})

app.post('/api/material/descuento', (req, res) => {

    let body = req.body;


    let lotes_ = '';
    let names;
    // //console.log(body.lotes);

    let set = new Set(body.lotes.map(JSON.stringify))
    body.lotes = Array.from(set).map(JSON.parse);

    let x = 0;

    let materiales = [];
    let lotes = [];
    let solicitados = [];

    let orden = []
    let material__ = []

    let Requi = false;
    let Producto_name;

    // let EA_Cantidad = body.EA_Cantidad

    // //console.log(body)

    if (body.requi) {
        Requi = true
        Requisicion.findOneAndUpdate({ _id: body.requi }, { estado: 'Finalizado' }, (err, requi) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
        })

    }



    Orden.findOneAndUpdate({ sort: body.orden }, { estado: 'activo' }, (err, modificado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
    })

    for (let i = 0; i < body.lotes.length; i++) {

        body.lotes[i].solicitado = (Number(body.lotes[i].solicitado)).toFixed(2)

        // //console.log(body.lotes[i].Mname,'-',body.lotes[i].lote,'-',body.lotes[i].codigo)
        Almacenado.findOne({ material: body.lotes[i].Mname, lote: body.lotes[i].lote, codigo: body.lotes[i].codigo, cantidad: { $gt: 0 } })
            .populate({
                path: 'material',
                populate: {
                    path: 'grupo'
                }
            })
            .exec((err, resp) => {
                if (resp.material.grupo.nombre === "Tinta" || resp.material.grupo.nombre === "Barniz" || resp.material.grupo.nombre === "Pega") {
                    if (body.lotes[i].EA_Cantidad > 0) {
                        body.lotes[i].resta = 0;
                    }
                }

                Almacenado.findOneAndUpdate({ material: body.lotes[i].Mname, lote: body.lotes[i].lote, codigo: body.lotes[i].codigo, cantidad: { $gt: 0 } }, { cantidad: body.lotes[i].resta }, (err, MaterialDB) => {
                    // Almacenado.findOneAndUpdate({material:body.lotes[i].Mname,lote:body.lotes[i].lote,codigo:body.lotes[i].codigo,cantidad:{$gt:0}},{codigo:body.lotes[i].codigo}, (err, MaterialDB)=>{
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }


                    Material.findById(MaterialDB.material, (err, material) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }

                        names = `${material.nombre} (${material.marca})`;
                        if (material.ancho) {
                            names = `${material.nombre} ${material.ancho} x ${material.largo} (${material.marca}) - Paleta: ${body.lotes[i].codigo}`;
                        }
                        if (material.grupo == "61fd54e2d9115415a4416f17" || material.grupo == "61fd6300d9115415a4416f60") {
                            names = `${material.nombre} (${material.marca}) - Lata: ${body.lotes[i].codigo}`;
                        }
                        if (material.grupo == "61fd72ecd9115415a4416f68") {
                            names = `${material.nombre} (${material.marca}) - Cuñete: ${body.lotes[i].codigo}`;
                        }



                        //  materiales.push(names);
                        materiales[i] = names;
                        //  //console.log(materiales)
                        lotes[i] = body.lotes[i].lote;
                        // lotes.push(body.lotes[i].lote)
                        //  //console.log(lotes)
                        if (material.unidad == 'Und') {
                            body.lotes[i].solicitado = Math.ceil(body.lotes[i].solicitado);
                        }
                        if (body.lotes[i].unidad === "PALETA" || body.lotes[i].unidad === "Paleta") {
                            solicitados[i] = `${body.lotes[i].solicitado} Und`
                            // solicitados.push(`${body.lotes[i].solicitado} Und - ${material.neto}${material.unidad}`)
                            body.lotes[i].unidad = 'Und'
                        } else {
                            if (material.grupo == "61fd54e2d9115415a4416f17" || material.grupo == "61fd6300d9115415a4416f60" || material.grupo == "61fd72ecd9115415a4416f68") {
                                solicitados[i] = `${body.lotes[i].unidad} - ${body.lotes[i].EA_Cantidad} ${material.unidad}`
                                body.lotes[i].solicitado = body.lotes[i].EA_Cantidad
                                //console.log(body.lotes[i].EA_Cantidad)
                            } else {
                                solicitados[i] = `${body.lotes[i].unidad} - ${body.lotes[i].solicitado} ${material.unidad}`
                            }
                        }
                        x++



                        data = `<tr><td>${names}</td>
                                <td>${body.lotes[i].lote}</td>
                                <td>${body.lotes[i].unidad} - ${body.lotes[i].solicitado} ${material.unidad}</td></tr>`
                        lotes_ = lotes_ + data;

                        // data = `<tr><td>${names}</td>
                        // <td>${body.lotes[i].lote}</td>
                        // <td>${body.lotes[i].solicitado} ${body.lotes[i].unidad} - ${material.neto}${material.unidad}</td></tr>`
                        // lotes_ = lotes_ + data;



                        //         // ////console.log({
                        //         //     material:material._id,
                        //         //     lote: body.lotes[i].lote,
                        //         //     codigo: body.lote[i].codigo,
                        //         //     cantidad: body.lotes[i].solicitado
                        //         // })

                        material__.push({
                            asignacion: body.solicitud,
                            material: material._id,
                            lote: body.lotes[i].lote,
                            codigo: body.lotes[i].codigo,
                            cantidad: body.lotes[i].solicitado,
                            EA_Cantidad: body.lotes[i].EA_Cantidad
                        })

                        //         // ////console.log(material__)

                        let final = body.lotes.length;
                        if (materiales.length == body.lotes.length && lotes.length == body.lotes.length && solicitados.length == body.lotes.length) {

                            // //console.log(lotes_)
                            // //console.log(lotes_)

                            // let nulos = materiales.find(null)
                            if (x == final) {
                                // //console.log(solicitados)
                                let solicitud__
                                if (body.solicitud >= 10) {
                                    solicitud__ = `00${body.solicitud}`
                                }
                                else if (body.solicitud >= 100) {
                                    solicitud__ = `0${body.solicitud}`
                                }
                                else if (body.solicitud < 10) {
                                    solicitud__ = `000${body.solicitud}`
                                }
                                const data = new Lote({
                                    asignacion: solicitud__,
                                    orden: body.orden,
                                    material: material__
                                }).save();
                                // orden.push(data)
                                ////console.log(orden)
                                FAL005(body.orden, body.solicitud, lotes_, materiales, lotes, solicitados, Requi)

                                res.json('ok')
                            }

                            // //console.log(materiales,'_' ,lotes)

                        }
                    })
                })


            })


        // ////console.log(i)
    }

})

app.put('/api/agregar-formula/:id', (req, res) => {
    let id = req.params.id;
    const body = req.body

    Material.findByIdAndUpdate(id, { preparacion: body }, (err, MaterialDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json(MaterialDB)
    })
})

app.post('/api/materiales/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body

    Material.findByIdAndUpdate(id, { eliminado: true }, (err, eliminado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        const NuevoDescuento = new Descuentos({
            material: id,
            descuento: eliminado.cantidad,
            razon: body.motivo
        }).save((err, modificacion) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: 'eliminado'
            })
        });

    })
})

app.get('/api/devoluciones', (req, res) => {
    Lote.find({ cerrado: { $ne: true } })
        .populate('material.material')
        .exec((err, lotes) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            res.json(lotes)
        })
})

app.put('/api/devoluciones', (req, res) => {
    let Body = req.body
    Lote.findByIdAndUpdate(Body.id, { cerrado: true }, (err, LoteDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json(LoteDB)
    })
})

app.get('/api/traslados-pendientes', async (req, res) => {
    try {

        // Buscarlo ya actualizado y populate
        const TrasladosPendientes = await traslados.find({ estatus: 'Por confirmar' }).populate('materiales.material');

        res.json({
            ok: true,
            msg: 'Traslado aceptado correctamente.',
            traslado: TrasladosPendientes
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Ocurrió un error al buscar traslado.',
            error: error.message
        });
    }
});

app.get('/api/traslado-acepta/:id', async (req, res) => {
    try {
        const trasladoId = req.params.id;

        // Buscar el traslado por ID y asegurarse que existe
        const traslado = await traslados.findById(trasladoId).populate('materiales.material');

        if (!traslado) {
            return res.status(404).json({
                ok: false,
                msg: 'Traslado no encontrado.'
            });
        }


        // Si no tiene número, asignarlo manualmente aquí (similar a pre('save'))
        if (!traslado.numero) {
            const yearPrefix = new Date().getFullYear().toString().slice(2);

            const lastDoc = await traslados.findOne({
                numero: { $regex: `^${yearPrefix}` }
            }).sort({ numero: -1 });

            let counter = 1;
            if (lastDoc && typeof lastDoc.numero === 'string') {
                const numberPart = lastDoc.numero.slice(2);
                if (/^\d+$/.test(numberPart)) {
                    counter = parseInt(numberPart, 10) + 1;
                }
            }

            traslado.numero = `${yearPrefix}${String(counter).padStart(3, '0')}`;
        }

        // Cambiar el estatus a "aceptada"
        traslado.estatus = 'aceptada';
        await traslado.save();

        // Volver a buscarlo ya actualizado y con populate
        const trasladoActualizado = await traslados.findById(trasladoId).populate('materiales.material');



        // 1. Insertar los materiales en almacenadoExterno
        const nuevosProductos = await almacenadoExterno.insertMany(traslado.materiales);

        // // 2. Actualizar campo "fuera" en Almacenado
        await Promise.all(traslado.materiales.map(async (p) => {
            if (!p._id) throw new Error("Producto sin _id");

            await Almacenado.updateOne(
                { _id: p._id },
                { $set: { fuera: true } }
            );
        }));

        NotaSalida(trasladoActualizado)


        res.json({
            ok: true,
            msg: 'Traslado aceptado correctamente.',
            traslado: trasladoActualizado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Ocurrió un error al aceptar el traslado.',
            error: error.message
        });
    }
});


app.get('/api/traslado-cancelada/:id', async (req, res) => {
    try {
        const trasladoId = req.params.id;

        // Buscar el traslado por ID y asegurarse que existe
        const traslado = await traslados.findById(trasladoId).populate('materiales.material');

        if (!traslado) {
            return res.status(404).json({
                ok: false,
                msg: 'Traslado no encontrado.'
            });
        }

        // Cambiar el estatus a "aceptada"
        traslado.estatus = 'cancelada';
        await traslado.save();

        // Volver a buscarlo ya actualizado y populate
        const trasladoActualizado = await traslados.findById(trasladoId).populate('materiales.material');

        res.json({
            ok: true,
            msg: 'Traslado aceptado correctamente.',
            traslado: trasladoActualizado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Ocurrió un error al aceptar el traslado.',
            error: error.message
        });
    }
});


app.post('/api/almacen-exterior', async (req, res) => {
    try {
        const traslado = req.body;

        if (!traslado || !Array.isArray(traslado.materiales) || traslado.materiales.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibieron materiales en el traslado.'
            });
        }

        // 1. Insertar los materiales en almacenadoExterno
        // const nuevosProductos = await almacenadoExterno.insertMany(traslado.materiales);

        // // 2. Actualizar campo "fuera" en Almacenado
        // await Promise.all(traslado.materiales.map(async (p) => {
        //   if (!p._id) throw new Error("Producto sin _id");

        //   await Almacenado.updateOne(
        //     { _id: p._id },
        //     { $set: { fuera: true } }
        //   );
        // }));

        // 3. Registrar el traslado completo (con los materiales ya insertados
        const trasladoGuardado = await traslados.create({
            ...traslado,
            materiales: traslado.materiales.map((m, i) => ({
                ...m,
                material: traslado.materiales[i].material._id // asegúrate que el orden se mantiene igual
            }))
        });

        // 🔁 Ahora lo populamos antes de mandarlo al frontend
        const trasladoPopulado = await traslados
            .findById(trasladoGuardado._id)
            .populate('materiales.material');

        res.status(201).json({
            ok: true,
            msg: 'Traslado y productos registrados correctamente.',
            traslado: trasladoPopulado,
            //   productos: nuevosProductos
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Ocurrió un error al registrar el traslado.',
            error: error.message
        });
    }
});


app.get('/api/almacen-exterior', async (req, res) => {
    try {
        // Buscar todos los productos almacenados
        const productos = await almacenadoExterno.find().populate('material');;

        res.status(200).json({
            ok: true,
            data: productos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Ocurrió un error al buscar los productos.',
            error: error.message
        });
    }
});



app.post('/api/materialess/reporte', (req, res) => {

    const body = req.body;

    const fechaInicio = body.desde;

    const fechaInicial = body.hasta;
    const fechaFinal = fechaInicial.substring(0, 8).concat(Number(fechaInicial.substring(8)));

    Descuentos.find({ $and: [{ fecha: { $gte: new Date(fechaInicio) } }, { fecha: { $lt: new Date(fechaFinal) } }] })
        .populate('material')
        .exec((err, descuentosDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Ingresos.find({ $and: [{ fecha: { $gte: new Date(fechaInicio) } }, { fecha: { $lt: new Date(fechaFinal) } }] })
                .populate('material')
                .exec((err, ingresosDB) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    Material.find({ eliminado: false })
                        .populate('grupo')
                        .sort('grupo.nombre')
                        .exec((err, materialesDB) => {

                            if (err) {
                                return res.status(400).json({
                                    ok: false,
                                    err
                                });
                            }

                            const total = {
                                descuentos: descuentosDB,
                                ingresos: ingresosDB,
                                almacen: materialesDB
                            }

                            res.json(total)
                        })


                })

        })
})




module.exports = app;