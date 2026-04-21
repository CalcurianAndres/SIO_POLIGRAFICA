const express = require('express');
const app = express();

const Orden = require('../database/models/orden.model')
const Despacho = require('../database/models/despacho.model')
const Trabajo = require('../database/models/trabajos.model')
const Gestiones = require('../database/models/gestiones.model')
const Requisicion = require('../database/models/requisicion.model')
const Devolucion = require('../database/models/devolucion.model')
const Lotes = require('../database/models/lotes.model')
const moment = require('moment');
const Almacenado = require('../database/models/almacenado.model')
const producto = require('../database/models/producto.model')

const mongoose = require('mongoose');

app.get('/api/inventario-reporte-filtro', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, clienteId, productoId } = req.query;

        // 1. Construir el filtro base para las Órdenes
        let filtroOrdenes = {
            fecha: { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) }
        };

        if (clienteId) filtroOrdenes.cliente = clienteId;

        // --- LÓGICA DE BÚSQUEDA POR "FOTO" (Nombre, Versión, Edición) ---
        if (productoId) {
            // Buscamos el producto maestro para saber qué versión/edición comparar
            const maestro = await producto.findById(productoId).lean();

            if (maestro) {
                // Filtramos las órdenes donde la "foto" coincida exactamente con el maestro
                filtroOrdenes["producto.producto"] = maestro.producto;
                filtroOrdenes["producto.version"] = maestro.version;
                filtroOrdenes["producto.edicion"] = maestro.edicion;
                filtroOrdenes["producto.codigo"] = maestro.codigo;
            }
        }

        console.log(filtroOrdenes)

        // Buscamos las órdenes (OPs) que coinciden con los criterios
        const ordenesEncontradas = await Orden.find(filtroOrdenes).select('sort').lean();
        const listaOPs = ordenesEncontradas.map(o => o.sort);

        // Si no se encuentran órdenes, devolvemos respuesta vacía de inmediato
        if (listaOPs.length === 0) {
            return res.json({
                rango: { fechaInicio, fechaFin, clienteId, productoId },
                reporte: [],
                ordenesProcesadas: [],
                resumenOrdenes: []
            });
        }

        // 2. Buscamos movimientos (Lotes y Devoluciones) asociados a esas OPs
        const filtroMovimientos = {
            orden: { $in: listaOPs },
            fecha: { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) }
        };

        const [lotes, devoluciones, ordenesModel] = await Promise.all([
            Lotes.find(filtroMovimientos).populate({ path: 'material.material', populate: { path: 'grupo' } }).lean(),
            Devolucion.find({ ...filtroMovimientos, status: 'Culminado' }).populate({ path: 'filtrado.material', populate: { path: 'grupo' } }).lean(),
            Orden.find(filtroOrdenes).populate('cliente').lean()
        ]);

        const resumenGrupos = {};

        const obtenerNodoMaterial = (grupo, mat) => {
            let nombreGrupoEfectivo = grupo.nombre || "Sin Grupo";
            const esSustrato = grupo.nombre && grupo.nombre.toLowerCase().includes('sustrato');

            if (esSustrato && mat.gramaje) {
                nombreGrupoEfectivo = mat.gramaje <= 200 ? "Sustratos (Papel)" : "Sustratos (Cartón)";
            }

            if (!resumenGrupos[nombreGrupoEfectivo]) {
                resumenGrupos[nombreGrupoEfectivo] = {
                    nombreGrupo: nombreGrupoEfectivo,
                    materiales: {}
                };
            }

            const matId = mat._id.toString();
            if (!resumenGrupos[nombreGrupoEfectivo].materiales[matId]) {
                resumenGrupos[nombreGrupoEfectivo].materiales[matId] = {
                    nombreMaterial: mat.nombre,
                    marca: mat.marca || 'N/A',
                    dimensiones: mat.gramaje ? `${mat.ancho}x${mat.largo} ${mat.gramaje}g/m² ${mat.calibre}pt` : '',
                    unidad: mat.unidad || 'Unds',
                    tecnicos: {
                        gramaje: Number(mat.gramaje) || 0,
                        ancho: Number(mat.ancho) || 0,
                        largo: Number(mat.largo) || 0
                    },
                    asignado_op: 0, devuelto_op: 0, asignado_ad: 0, devuelto_ad: 0
                };
            }
            return resumenGrupos[nombreGrupoEfectivo];
        };

        // Procesar Asignaciones
        lotes.forEach(l => {
            l.material.forEach(item => {
                if (!item.material?.grupo) return;
                const nodo = obtenerNodoMaterial(item.material.grupo, item.material);
                nodo.materiales[item.material._id.toString()].asignado_op += Number(item.cantidad) || 0;
            });
        });

        // Procesar Devoluciones
        devoluciones.forEach(d => {
            d.filtrado.forEach(item => {
                if (!item.material?.grupo) return;
                const nodo = obtenerNodoMaterial(item.material.grupo, item.material);
                nodo.materiales[item.material._id.toString()].devuelto_op += Number(item.cantidad) || 0;
            });
        });

        // 3. Mapeo Final con cálculo de toneladas
        const reporteFinal = Object.values(resumenGrupos).map(grupo => {
            const detalles = Object.values(grupo.materiales).map(m => {
                const neto_op = m.asignado_op - m.devuelto_op;
                const neto_total = neto_op;

                const calcularPeso = (cantidad) => {
                    if (m.tecnicos.ancho > 0 && m.tecnicos.largo > 0 && m.tecnicos.gramaje > 0 && cantidad > 0) {
                        return (m.tecnicos.ancho * m.tecnicos.largo * m.tecnicos.gramaje * cantidad) / 10000000000;
                    }
                    return 0;
                };

                const toneladas_op = calcularPeso(neto_op);

                return {
                    ...m,
                    neto_op,
                    neto_ad: 0,
                    neto_total,
                    toneladas_op: Number(toneladas_op.toFixed(4)),
                    toneladas_ad: 0,
                    toneladas_gral: Number(toneladas_op.toFixed(4))
                };
            });

            return {
                grupo: grupo.nombreGrupo,
                total_neto_op: detalles.reduce((acc, d) => acc + d.neto_op, 0),
                total_neto_ad: 0,
                total_neto_gral: detalles.reduce((acc, d) => acc + d.neto_total, 0),
                total_toneladas_op: detalles.reduce((acc, d) => acc + d.toneladas_op, 0),
                total_toneladas_ad: 0,
                total_toneladas_gral: detalles.reduce((acc, d) => acc + d.toneladas_gral, 0),
                detalleMateriales: detalles.sort((a, b) => b.neto_op - a.neto_op)
            };
        });

        // Responder con la misma estructura exacta para compatibilidad con el Front
        res.json({
            rango: { fechaInicio, fechaFin, clienteId, productoId },
            reporte: reporteFinal,
            ordenesProcesadas: listaOPs,
            resumenOrdenes: ordenesModel
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el reporte filtrado por cliente/producto" });
    }
});

app.get('/api/inventario-reporte-op', async (req, res) => {
    try {
        const { op } = req.query;
        if (!op) return res.status(400).json({ error: "Debe proporcionar una OP" });

        const [lotes, devoluciones, ordenInfo] = await Promise.all([
            Lotes.find({ orden: op }).populate({ path: 'material.material', populate: { path: 'grupo' } }).lean(),
            Devolucion.find({ orden: op, status: 'Culminado' }).populate({ path: 'filtrado.material', populate: { path: 'grupo' } }).lean(),
            Orden.findOne({ sort: op }).populate('cliente').lean()
        ]);

        const resumenGrupos = {};

        const obtenerNodoMaterial = (grupo, mat) => {
            let nombreGrupoEfectivo = grupo.nombre || "Sin Grupo";
            const esSustrato = grupo.nombre && grupo.nombre.toLowerCase().includes('sustrato');

            if (esSustrato && mat.gramaje) {
                nombreGrupoEfectivo = mat.gramaje <= 200 ? "Sustratos (Papel)" : "Sustratos (Cartón)";
            }

            if (!resumenGrupos[nombreGrupoEfectivo]) {
                resumenGrupos[nombreGrupoEfectivo] = { nombreGrupo: nombreGrupoEfectivo, materiales: {} };
            }

            const matId = mat._id.toString();
            if (!resumenGrupos[nombreGrupoEfectivo].materiales[matId]) {
                resumenGrupos[nombreGrupoEfectivo].materiales[matId] = {
                    nombreMaterial: mat.nombre,
                    marca: mat.marca || 'N/A',
                    dimensiones: mat.gramaje ? `${mat.ancho}x${mat.largo} ${mat.gramaje}g/m² ${mat.calibre}pt` : '',
                    unidad: mat.unidad || 'Unds',
                    tecnicos: {
                        gramaje: Number(mat.gramaje) || 0,
                        ancho: Number(mat.ancho) || 0,
                        largo: Number(mat.largo) || 0
                    },
                    // Mantenemos exactamente los mismos nombres de variables
                    asignado_op: 0, devuelto_op: 0, asignado_ad: 0, devuelto_ad: 0
                };
            }
            return resumenGrupos[nombreGrupoEfectivo];
        };

        // En búsqueda por OP, asumimos que todo es "asignado_op" 
        // porque el usuario está filtrando por el número de orden directamente
        lotes.forEach(l => {
            l.material.forEach(item => {
                if (!item.material?.grupo) return;
                const nodo = obtenerNodoMaterial(item.material.grupo, item.material);
                nodo.materiales[item.material._id.toString()].asignado_op += Number(item.cantidad) || 0;
            });
        });

        devoluciones.forEach(d => {
            d.filtrado.forEach(item => {
                if (!item.material?.grupo) return;
                const nodo = obtenerNodoMaterial(item.material.grupo, item.material);
                nodo.materiales[item.material._id.toString()].devuelto_op += Number(item.cantidad) || 0;
            });
        });

        const reporteFinal = Object.values(resumenGrupos).map(grupo => {
            const detalles = Object.values(grupo.materiales).map(m => {
                const neto_op = m.asignado_op - m.devuelto_op;
                const neto_ad = 0; // En búsqueda por OP específica, esto suele ser 0
                const neto_total = neto_op + neto_ad;

                const calcularPeso = (cantidad) => {
                    if (m.tecnicos.ancho > 0 && m.tecnicos.largo > 0 && m.tecnicos.gramaje > 0 && cantidad > 0) {
                        return (m.tecnicos.ancho * m.tecnicos.largo * m.tecnicos.gramaje * cantidad) / 10000000000;
                    }
                    return 0;
                };

                return {
                    ...m,
                    neto_op,
                    neto_ad,
                    neto_total,
                    toneladas_op: Number(calcularPeso(neto_op).toFixed(4)),
                    toneladas_ad: 0,
                    toneladas_gral: Number(calcularPeso(neto_total).toFixed(4))
                };
            });

            return {
                grupo: grupo.nombreGrupo,
                total_neto_op: detalles.reduce((acc, d) => acc + d.neto_op, 0),
                total_neto_ad: 0,
                total_neto_gral: detalles.reduce((acc, d) => acc + d.neto_total, 0),
                total_toneladas_op: detalles.reduce((acc, d) => acc + d.toneladas_op, 0),
                total_toneladas_ad: 0,
                total_toneladas_gral: detalles.reduce((acc, d) => acc + d.toneladas_gral, 0),
                detalleMateriales: detalles.sort((a, b) => b.neto_op - a.neto_op)
            };
        });

        res.json({
            rango: { fechaInicio: null, fechaFin: null, op: op },
            reporte: reporteFinal,
            ordenesProcesadas: [op],
            resumenOrdenes: [ordenInfo] // Lo enviamos como array para que el *ngFor del front no falle
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en reporte de OP" });
    }
});

app.get('/api/inventario-reporte-detallado', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        const filtroFecha = {
            fecha: { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) }
        };

        const [lotes, devoluciones, ordenesModel] = await Promise.all([
            Lotes.find(filtroFecha).populate({ path: 'material.material', populate: { path: 'grupo' } }).lean(),
            Devolucion.find({ ...filtroFecha, status: 'Culminado' }).populate({ path: 'filtrado.material', populate: { path: 'grupo' } }).lean(),
            Orden.find(filtroFecha).select('sort orden fecha cliente producto').populate('cliente').lean()
        ]);

        const ordenesSet = new Set();
        ordenesModel.forEach(o => { if (o.sort) ordenesSet.add(o.sort); });
        lotes.forEach(l => { if (l.orden && l.orden !== '#') ordenesSet.add(l.orden); });
        devoluciones.forEach(d => { if (d.orden && d.orden !== '#') ordenesSet.add(d.orden); });

        const listaOrdenes = Array.from(ordenesSet).sort();
        const resumenGrupos = {};

        const obtenerNodoMaterial = (grupo, mat) => {
            let nombreGrupoEfectivo = grupo.nombre || "Sin Grupo";
            const esSustrato = grupo.nombre && grupo.nombre.toLowerCase().includes('sustrato');

            // --- LÓGICA DE CLASIFICACIÓN PAPEL VS CARTÓN ---
            if (esSustrato && mat.gramaje) {
                nombreGrupoEfectivo = mat.gramaje <= 200 ? "Sustratos (Papel)" : "Sustratos (Cartón)";
            }

            const grupoId = nombreGrupoEfectivo; // Agrupamos por el nuevo nombre

            if (!resumenGrupos[grupoId]) {
                resumenGrupos[grupoId] = {
                    nombreGrupo: nombreGrupoEfectivo,
                    materiales: {}
                };
            }

            const matId = mat._id.toString();
            if (!resumenGrupos[grupoId].materiales[matId]) {
                resumenGrupos[grupoId].materiales[matId] = {
                    nombreMaterial: mat.nombre,
                    marca: mat.marca || 'N/A',
                    dimensiones: mat.gramaje ? `${mat.ancho}x${mat.largo} ${mat.gramaje}g/m² ${mat.calibre}pt` : '',
                    unidad: mat.unidad || 'Unds',
                    // Datos técnicos para el cálculo de peso
                    tecnicos: {
                        gramaje: Number(mat.gramaje) || 0,
                        ancho: Number(mat.ancho) || 0,
                        largo: Number(mat.largo) || 0
                    },
                    asignado_op: 0, devuelto_op: 0, asignado_ad: 0, devuelto_ad: 0
                };
            }
            return resumenGrupos[grupoId];
        };

        // 1. PROCESAR ASIGNACIONES
        lotes.forEach(lote => {
            const esAdicional = lote.orden === '#';
            lote.material.forEach(item => {
                if (!item.material || !item.material.grupo) return;
                const nodo = obtenerNodoMaterial(item.material.grupo, item.material);
                const matId = item.material._id.toString();
                const cant = Number(item.cantidad) || 0;
                if (esAdicional) nodo.materiales[matId].asignado_ad += cant;
                else nodo.materiales[matId].asignado_op += cant;
            });
        });

        // 2. PROCESAR DEVOLUCIONES
        devoluciones.forEach(dev => {
            const esAdicional = dev.orden === '#';
            dev.filtrado.forEach(item => {
                if (!item.material || !item.material.grupo) return;
                const nodo = obtenerNodoMaterial(item.material.grupo, item.material);
                const matId = item.material._id.toString();
                const cantDev = Number(item.cantidad) || 0;
                if (esAdicional) nodo.materiales[matId].devuelto_ad += cantDev;
                else nodo.materiales[matId].devuelto_op += cantDev;
            });
        });

        // 3. MAPEO FINAL CON CÁLCULO DE TONELADAS
        const reporteFinal = Object.values(resumenGrupos).map(grupo => {
            const detalles = Object.values(grupo.materiales).map(m => {
                const neto_op = m.asignado_op - m.devuelto_op;
                const neto_ad = m.asignado_ad - m.devuelto_ad;
                const neto_total = neto_op + neto_ad;

                // --- FUNCIÓN INTERNA PARA CALCULAR PESO ---
                const calcularPeso = (cantidad) => {
                    if (m.tecnicos.ancho > 0 && m.tecnicos.largo > 0 && m.tecnicos.gramaje > 0 && cantidad > 0) {
                        return (m.tecnicos.ancho * m.tecnicos.largo * m.tecnicos.gramaje * cantidad) / 10000000000;
                    }
                    return 0;
                };

                const toneladas_op = calcularPeso(neto_op);
                const toneladas_ad = calcularPeso(neto_ad);
                const toneladas_gral = toneladas_op + toneladas_ad;

                return {
                    ...m,
                    neto_op,
                    neto_ad,
                    neto_total,
                    // Toneladas por línea de material
                    toneladas_op: Number(toneladas_op.toFixed(4)),
                    toneladas_ad: Number(toneladas_ad.toFixed(4)),
                    toneladas_gral: Number(toneladas_gral.toFixed(4))
                };
            });

            const ordenesPorCliente = {};

            ordenesModel.forEach(o => {
                const clienteNombre = o.cliente?.nombre || 'Sin Cliente';
                if (!ordenesPorCliente[clienteNombre]) {
                    ordenesPorCliente[clienteNombre] = 0;
                }
                ordenesPorCliente[clienteNombre]++;
            });

            // Convertimos a array y ordenamos de mayor a menor
            rankingClientes = Object.entries(ordenesPorCliente)
                .map(([nombre, cantidad]) => ({ nombre, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 10); // Top 10 clientes


            return {
                grupo: grupo.nombreGrupo,
                total_neto_op: detalles.reduce((acc, d) => acc + d.neto_op, 0),
                total_neto_ad: detalles.reduce((acc, d) => acc + d.neto_ad, 0),
                total_neto_gral: detalles.reduce((acc, d) => acc + d.neto_total, 0),

                // --- TOTALES DE TONELAJE POR GRUPO ---
                total_toneladas_op: detalles.reduce((acc, d) => acc + d.toneladas_op, 0),
                total_toneladas_ad: detalles.reduce((acc, d) => acc + d.toneladas_ad, 0),
                total_toneladas_gral: detalles.reduce((acc, d) => acc + d.toneladas_gral, 0),

                detalleMateriales: detalles
            };
        });

        reporteFinal.forEach(grupo => {
            grupo.detalleMateriales.sort((a, b) => b.neto_op - a.neto_op);
        });

        res.json({
            rango: { fechaInicio, fechaFin },
            reporte: reporteFinal,
            ordenesProcesadas: listaOrdenes,
            resumenOrdenes: ordenesModel,
            rankingClientes
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el reporte maestro" });
    }
});

app.get('/api/rendimiento/:orden', async (req, res) => {
    try {
        const { orden } = req.params;

        // 1. OBTENER CONFIGURACIÓN DE LA ORDEN
        const datosOrden = await Orden.findOne({ sort: orden }).lean();
        if (!datosOrden) return res.status(404).json({ error: "No se encontró la configuración de la Orden" });

        const ordenID = datosOrden._id.toString();
        const ejemplaresPorHoja = Number(datosOrden.producto.ejemplares[datosOrden.montaje]) || 1;
        const productoNombre = datosOrden.producto.producto || "N/A";

        // --- CÁLCULO DE DEMASÍA REVERSO (Demasía ya incluida en el total) ---
        const paginasTotales = Number(datosOrden.paginas) || 0; // Ejemplo: 37700
        const porcentajeDemasia = Number(datosOrden.demasia) || 0; // Ejemplo: 0.533

        // Hallamos la base (unidades que se necesitan despachar originalmente)
        // Formula: Base = Total / (1 + (porcentaje/100))
        const unidadesBase = Math.floor(paginasTotales / (1 + (porcentajeDemasia / 100)));

        // La demasía es la diferencia entre el total y la base
        const unidadesDemasia = paginasTotales - unidadesBase;


        const hojasDemasiaPlanificada = Math.ceil(unidadesDemasia);
        const hojasNetasPlanificadas = Math.floor(unidadesBase);
        // -------------------------------------------------------------------

        // 2. CALCULAR PRODUCTO DESPACHADO Y LISTAR HISTORIAL
        const todosLosDespachos = await Despacho.find({ "despacho.op": orden }).lean();
        let totalUnidadesDespachadas = 0;
        let historialDespachos = [];

        todosLosDespachos.forEach(doc => {
            doc.despacho.forEach(item => {
                if (item.op === orden) {
                    const cant = Number(item.cantidad) || 0;
                    totalUnidadesDespachadas += cant;
                    historialDespachos.push({
                        identificador: item.parcial || doc.fecha || 'N/A',
                        cantidad: cant,
                        documento: item.documento || 'S/D',
                        certificado: item.certificado || 'N/A',
                        hojasEquivalentes: Math.ceil(cant / ejemplaresPorHoja)
                    });
                }
            });
        });

        let totalHojasDespachadas = Math.ceil(totalUnidadesDespachadas / ejemplaresPorHoja);

        // 3. DETERMINAR MÁQUINA FINAL Y SUSTRATO PROCESADO
        const ultimoTrabajo = await Trabajo.findOne({ orden: ordenID }).sort({ pos: -1 }).lean();
        const maquinaFinal = ultimoTrabajo ? ultimoTrabajo.maquina : "N/A";

        const gestiones = await Gestiones.find({ op: ordenID, maquina: maquinaFinal }).lean();
        const totalSustratoProcesado = gestiones.reduce((acc, ges) => acc + (Number(ges.hojas) || 0), 0);

        // 4. PROCESAR MATERIALES (SUSTRATOS Y MATERIA PRIMA)
        const lotes = await Lotes.find({ orden: orden }).populate('material.material');
        let sustratosMap = {};
        let materiaPrimaMap = {};
        let asignaciones = 0
        let cabidaPorCaja = 0;
        lotes.forEach(lote => {
            lote.material.forEach(mat => {
                if (!mat.material) return;
                const idMat = mat.material._id.toString();
                const cant = Number(mat.cantidad) || 0;

                if (mat.material.gramaje) {
                    if (!sustratosMap[idMat]) {
                        sustratosMap[idMat] = {
                            nombre: `${mat.material.nombre} (${mat.material.ancho} x ${mat.material.largo}) ${mat.material.gramaje}g/m² ${mat.material.calibre}pt (${mat.material.marca})`,
                            asignado: 0,
                            devuelto: 0
                        };
                    }
                    sustratosMap[idMat].asignado += cant;
                } else {
                    if (!materiaPrimaMap[idMat]) {
                        materiaPrimaMap[idMat] = {
                            nombre: `${mat.material.nombre} (${mat.material.marca})`,
                            unidad: mat.material.unidad || 'Unds',
                            asignado: 0,
                            devuelto: 0
                        };

                        if (mat.material.grupo && asignaciones <= 0) {
                            if (mat.material.grupo.toString() === '61fd7a8ed9115415a4416f74') {
                                console.log(idMat, 'ES CAJA', `${mat.material.nombre} (${mat.material.marca})`)
                                cabidaPorCaja = datosOrden.producto.materiales[datosOrden.montaje].find(m => m.producto.toString() === idMat)?.cantidad || 0;
                                console.log('CABIDA POR CAJA:', cabidaPorCaja)
                                if (cabidaPorCaja > 0) {
                                    asignaciones++;
                                }
                            }
                        }
                    }
                    materiaPrimaMap[idMat].asignado += cant;
                }
            });
        });

        // 5. PROCESAR DEVOLUCIONES
        const devoluciones = await Devolucion.find({ orden: orden, status: 'Culminado' }).populate('filtrado.material');
        devoluciones.forEach(dev => {
            dev.filtrado.forEach(item => {
                if (!item.material) return;
                const idMat = item.material._id.toString();
                const cantDev = (Number(item.cantidad) || 0);
                if (sustratosMap[idMat]) sustratosMap[idMat].devuelto += cantDev;
                else if (materiaPrimaMap[idMat]) materiaPrimaMap[idMat].devuelto += cantDev;
            });
        });

        // 6. CÁLCULOS FINALES
        const detallesSustratos = Object.values(sustratosMap).map(s => ({ ...s, usado: s.asignado - s.devuelto }));
        const detallesMateriaPrima = Object.values(materiaPrimaMap).map(m => ({ ...m, usado: m.asignado - m.devuelto }));
        const totalUsado = detallesSustratos.reduce((acc, s) => acc + s.usado, 0);
        if (datosOrden.cliente == '68dfd6f0cb4d5b01d8f54684') {
            totalUnidadesDespachadas = totalUnidadesDespachadas * cabidaPorCaja;
            totalHojasDespachadas = totalUnidadesDespachadas / ejemplaresPorHoja;
        }

        const rendimientoGral = totalUsado > 0
            ? ((totalSustratoProcesado / totalUsado) * 100).toFixed(2)
            : 0;

        // 7. RESPUESTA FINAL
        res.json({
            orden: orden,
            op: ordenID,
            producto: productoNombre,
            cantidadSolicitada: datosOrden.cantidad || 0,
            ejemplaresPorHoja,
            rendimiento: rendimientoGral,
            cabida: cabidaPorCaja,
            maquinaFinal,
            planificacion: {
                paginasTotales: paginasTotales,
                unidadesBase: Math.round(unidadesBase),
                porcentajeDemasia: porcentajeDemasia,
                hojasDemasia: hojasDemasiaPlanificada,
                hojasNetas: hojasNetasPlanificadas
            },
            metricas: {
                procesadoHojas: totalSustratoProcesado,
                despachadoHojas: Math.ceil(totalHojasDespachadas),
                totalUsadoHojas: totalUsado,
                unidadesTotalesDespachadas: totalUnidadesDespachadas
            },
            detallesSustratos,
            detallesMateriaPrima,
            historialDespachos
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el cálculo integral" });
    }
});

app.get('/api/reportes/consumo-materiales-por-periodo', async (req, res) => {
    try {
        const from = new Date(req.query.from);
        const to = new Date(req.query.to);
        const groupBy = req.query.groupBy || 'month'; // month | year

        const periodos = [];
        const cursor = new Date(from);
        cursor.setDate(1);

        while (cursor <= to) {
            const inicio = new Date(cursor);
            let fin;

            if (groupBy === 'year') {
                fin = new Date(inicio.getFullYear(), 11, 31, 23, 59, 59);
                cursor.setFullYear(cursor.getFullYear() + 1);
            } else {
                fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59);
                cursor.setMonth(cursor.getMonth() + 1);
            }

            if (fin > to) fin = new Date(to);

            const resultado = {};

            /* ================= ASIGNACIONES ================= */
            const asignaciones = await Lotes.find({
                fecha: { $gte: inicio, $lte: fin }
            })
                .populate({
                    path: "material.material",
                    populate: { path: "grupo" }
                })
                .lean();

            for (const a of asignaciones) {
                for (const m of a.material) {

                    const mat = m.material;
                    if (!mat) continue;

                    const key = [
                        mat.grupo?.nombre,
                        mat.nombre,
                        mat.marca,
                        mat.calibre,
                        mat.gramaje,
                        mat.ancho,
                        mat.largo
                    ].join("|");

                    if (!resultado[key]) {
                        resultado[key] = {
                            grupo: mat.grupo?.nombre || "SIN_GRUPO",

                            asignado_total: 0,
                            asignado_op: 0,
                            asignado_otros: 0,

                            devuelto_total: 0,
                            devuelto_op: 0,
                            devuelto_otros: 0
                        };
                    }

                    const cantidad = Number(m.cantidad) || 0;

                    resultado[key].asignado_total += cantidad;

                    if (a.orden === "#") {
                        resultado[key].asignado_otros += cantidad;
                    } else {
                        resultado[key].asignado_op += cantidad;
                    }
                }
            }

            /* ================= DEVOLUCIONES ================= */
            const devoluciones = await Devolucion.find({
                status: "Culminado",
                fecha: { $gte: inicio, $lte: fin }
            })
                .populate({
                    path: "filtrado.material",
                    populate: { path: "grupo" }
                })
                .lean();

            for (const d of devoluciones) {
                for (const f of d.filtrado) {

                    const mat = f.material;
                    if (!mat) continue;

                    const key = [
                        mat.grupo?.nombre,
                        mat.nombre,
                        mat.marca,
                        mat.calibre,
                        mat.gramaje,
                        mat.ancho,
                        mat.largo
                    ].join("|");

                    if (!resultado[key]) continue;

                    const cantidad = Number(f.cantidad) || 0;

                    resultado[key].devuelto_total += cantidad;

                    if (d.orden === "#") {
                        resultado[key].devuelto_otros += cantidad;
                    } else {
                        resultado[key].devuelto_op += cantidad;
                    }
                }
            }

            /* ================= AGRUPAR POR GRUPO ================= */
            const porGrupo = {};

            for (const item of Object.values(resultado)) {

                if (!porGrupo[item.grupo]) {
                    porGrupo[item.grupo] = {
                        grupo: item.grupo,

                        totalAsignado: 0,
                        totalAsignadoOP: 0,
                        totalAsignadoOtros: 0,

                        totalDevuelto: 0,
                        totalDevueltoOP: 0,
                        totalDevueltoOtros: 0,

                        totalConsumido: 0,
                        totalConsumidoOP: 0
                    };
                }

                porGrupo[item.grupo].totalAsignado += item.asignado_total;
                porGrupo[item.grupo].totalAsignadoOP += item.asignado_op;
                porGrupo[item.grupo].totalAsignadoOtros += item.asignado_otros;

                porGrupo[item.grupo].totalDevuelto += item.devuelto_total;
                porGrupo[item.grupo].totalDevueltoOP += item.devuelto_op;
                porGrupo[item.grupo].totalDevueltoOtros += item.devuelto_otros;

                porGrupo[item.grupo].totalConsumido += (item.asignado_total - item.devuelto_total);
                porGrupo[item.grupo].totalConsumidoOP += (item.asignado_op - item.devuelto_op);
            }

            periodos.push({
                year: inicio.getFullYear(),
                month: groupBy === 'month' ? inicio.getMonth() + 1 : null,
                label: groupBy === 'month'
                    ? `${inicio.toLocaleString('es', { month: 'long' })} ${inicio.getFullYear()}`
                    : `${inicio.getFullYear()}`,
                grupos: Object.values(porGrupo)
            });
        }

        res.json(periodos);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generando reporte por periodo" });
    }
});



app.get('/api/estadisticas/maquinas', (req, res) => {

    _realizados = []

    Gestiones.find()
        .populate('maquina')
        .exec((err, trabajos) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            for (let i = 0; i < trabajos.length; i++) {

                let fecha = moment(trabajos[i].fecha, 'yyyy-MM-DD')

                let mes = fecha.month() + 1
                let ano = fecha.year()

                let index = trabajos_realizados.findIndex(x => x.maquina === trabajos[i].maquina.nombre)
                if (index < 0) {
                    dato = { maquina: trabajos[i].maquina.nombre, datos: [{ [ano]: { [mes]: {} } }] }
                    trabajos_realizados.push(
                        dato
                    )
                } else {

                    let year = ano.toString()
                    let month = mes.toString()


                    for (let n = 0; n < trabajos_realizados[index].datos.length; n++) {
                        // if(!trabajos_realizados[index].datos[n])
                    }
                    return

                    // if(!trabajos_realizados[index].datos.[year])
                    // {
                    //     //console.log(ano)
                    //     //console.log(trabajos_realizados[index].push({[ano]:{[mes]:{}}}))

                    //     return
                    // }
                    //  if(!trabajos_realizados[index][year]){
                    //     trabajos_realizados[index].push({[ano]:{[mes]:{}}})
                    //  }
                    // //console.log(trabajos_realizados[index][anuel])

                    // let find_mes = trabajos_realizados.findIndex(x=> x.maquina === trabajos[i].maquina.nombre && x.mes === mes)
                    //  if(find_mes < 0){
                    //     dato = {maquina:trabajos[i].maquina.nombre,mes,ano,productos:trabajos[i].productos,hojas:trabajos[i].hojas}
                    //     trabajos_realizados.push(
                    //      dato
                    //     )
                    //  }else{
                    //     //console.log(trabajos_realizados[index].hojas)
                    //     trabajos_realizados[index].hojas === Number(trabajos_realizados[index].hojas) + Number(trabajos[i].hojas)
                    //     trabajos_realizados[index].productos === Number(trabajos_realizados[index].productos) + Number(trabajos[i].productos)
                    //  }
                }
            }

            res.json(trabajos_realizados)
        })

})


app.post('/api/estadisticas/ordens', (req, res) => {

    let body = req.body;
    let sort;
    let orden__;

    // //console.log(body.desde,'/',body.hasta);

    let desde = moment(body.desde)
    let hasta = moment(body.hasta)


    if (body.op) {
        sort = { sort: body.op }
        orden__ = { orden: body.op, status: { $ne: 'Cancelado' } }

    } else {
        sort = { fecha: { $gte: desde, $lte: hasta } }
        orden__ = { fecha: { $gte: desde, $lte: hasta }, status: { $ne: 'Cancelado' } }
        // Orden.find({fecha:{
        //     $gte:desde,
        //     $lt: hasta
        // }},
    }

    if (body.cliente) {
        if (body.producto) {
            if (body.desde && body.hasta) {
                sort = { cliente: body.cliente.cliente, 'producto.producto': body.producto, fecha: { $gte: desde, $lt: hasta } }
            } else {
                sort = { cliente: body.cliente.cliente, 'producto.producto': body.producto }
            }
        } else {
            if (body.desde && body.hasta) {
                sort = { cliente: body.cliente.cliente, fecha: { $gte: desde, $lt: hasta } }
            } else {
                sort = { cliente: body.cliente.cliente }
            }
        }
    }

    let desde_f = moment(body.desde).format('DD-MM-yyyy')
    let hasta_f = moment(body.hasta).format('DD-MM-yyyy')

    let despachos = [];
    let requisiciones = [];
    let devoluciones = [];
    let trabajos = [];
    let gestiones = [];
    let lotes = [];
    let Adicionales = [];
    let Tintas = [];
    let Sustratos = [];
    let Devolucion_Sustratos = [];
    let Papel_Asignado = 0;
    let Carton_Asignado = 0;
    let Papel_Devuelto = 0;
    let Carton_Devuelto = 0;
    let Ordenes = []
    let Sustratos_adicionales = []
    let x = 0;

    let Caja = []
    let Devolucion_Caja = []

    let Pega = [];
    let Devolucion_Pega = [];
    let Total_Pega = 0;
    let Devolucion_Total_pega = 0;

    let Barniz = []
    let Devolucion_Barniz = []
    let Barniz_acuoso = []
    let Total_barniz = 0;
    let Devolucion_Total_barniz = 0;
    let Total_barniz_acuoso = 0;

    let adicional_Amarillo = 0;
    let adicional_Cyan = 0;
    let adicional_Magenta = 0;
    let adicional_Negro = 0;
    let adicional_Pantone = 0;

    let Devolucion_Amarillo = 0;
    let Devolucion_Cyan = 0;
    let Devolucion_Magenta = 0;
    let Devolucion_Negro = 0;
    let Devolucion_Pantone = 0;

    let Amarillo = 0;
    let Cyan = 0;
    let Magenta = 0;
    let Negro = 0;
    let Pantone = 0;

    let Total_Tintas_Adicionales = 0;
    let Total_Tintas = 0;
    let total_tintas_devueltas = 0;

    let data = []
    let orderss = []

    let devoluciones_totales = [];

    // Orden.find({fecha:{
    //     $gte:desde,
    //     $lt: hasta
    // }},
    Orden.find(sort,
        (err, orden) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Ordenes = orden;
            //console.log(Ordenes)
            if (orden.length < 1) {
                res.json({ mensaje: 'No se encontró orden de producción' })
                return
            }
            for (let i = 0; i < orden.length; i++) {
                Devolucion.find({ orden: orden[i].sort })
                    .populate('filtrado.material')
                    .exec((err, DevolucionesDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        // for(let x=0; x<DevolucionesDB.length; x++){
                        //     devoluciones.push(DevolucionesDB[x])
                        // }
                    })
                Gestiones.find({ op: orden[i]._id }, (err, GestinesDB) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    for (let n = 0; n < GestinesDB.length; n++) {
                        gestiones.push(GestinesDB[n])
                    }

                })
                Trabajo.find({ orden: orden[i]._id })
                    .populate('maquina')
                    .sort('pos')
                    .exec((err, Trabajos) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }

                        for (let n = 0; n < Trabajos.length; n++) {
                            // //console.log(Trabajos[n])
                            trabajos.push(Trabajos[n])
                        }

                    })

                Despacho.find({ 'despacho.op': orden[i].sort })
                    .exec((err, resp) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }

                        for (let n = 0; n < resp.length; n++) {
                            despachos.push(resp[n])
                            // //console.log(despachos)
                        }
                    })



                if (body.cliente) {
                    orderss.push(orden[i].sort)
                    orden__ = { orden: { $in: orderss }, status: { $ne: 'Cancelado' } }
                }
            }

            Devolucion.find(orden__)
                // Devolucion.find({fecha:{$gte: desde,$lt: hasta}})
                .populate('filtrado.material')
                .exec((err, DevolucionesDB) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    for (let i = 0; i < DevolucionesDB.length; i++) {
                        devoluciones.push(DevolucionesDB[i])
                        for (let x = 0; x < DevolucionesDB[i].filtrado.length; x++) {
                            let material = DevolucionesDB[i].filtrado[x].material
                            let cantidad = DevolucionesDB[i].filtrado[x].cantidad
                            if (material.grupo == '61fd54e2d9115415a4416f17') {
                                total_tintas_devueltas = Number(total_tintas_devueltas) + cantidad;
                                total_tintas_devueltas = total_tintas_devueltas.toFixed(2)
                                switch (material.color) {
                                    case 'Amarillo':
                                        Devolucion_Amarillo = Devolucion_Amarillo + cantidad
                                        break;
                                    case 'Cyan':
                                        Devolucion_Cyan = Devolucion_Cyan + cantidad
                                        break;
                                    case 'Magenta':
                                        Devolucion_Magenta = Devolucion_Magenta + cantidad
                                        break;
                                    case 'Negro':
                                        Devolucion_Negro = Devolucion_Negro + cantidad
                                        break;
                                    default:
                                        Devolucion_Pantone = Devolucion_Pantone + cantidad
                                        break;
                                }
                            }
                            if (material.grupo == '61fd6300d9115415a4416f60') {
                                let material_adicional = DevolucionesDB[i].filtrado[x].material
                                let cantidad = Number((DevolucionesDB[i].filtrado[x].cantidad).toFixed(2))

                                let Existencia = Devolucion_Barniz.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                if (Existencia != -1) {
                                    Devolucion_Barniz[Existencia].Cantidad = Number(Devolucion_Barniz[Existencia].Cantidad) + Number(cantidad)
                                    Devolucion_Barniz[Existencia].Cantidad = (Devolucion_Barniz[Existencia].Cantidad).toFixed(2)
                                } else {
                                    Devolucion_Barniz.push({
                                        Nombre: material_adicional.nombre,
                                        Marca: material_adicional.marca,
                                        Cantidad: cantidad
                                    })
                                }
                                Devolucion_Total_barniz = Number(Devolucion_Total_barniz) + Number(cantidad);

                            }
                            if (material.grupo == '61fd7a8ed9115415a4416f74') {
                                let material_adicional = DevolucionesDB[i].filtrado[x].material
                                let cantidad = Number((DevolucionesDB[i].filtrado[x].cantidad).toFixed(2))

                                let Existencia = Devolucion_Caja.findIndex(x => x.Nombre === material_adicional.nombre)
                                if (Existencia != -1) {
                                    Devolucion_Caja[Existencia].Cantidad = Number(Devolucion_Caja[Existencia].Cantidad) + Number(cantidad)
                                    Devolucion_Caja[Existencia].Cantidad = (Devolucion_Caja[Existencia].Cantidad).toFixed(2)
                                } else {
                                    Devolucion_Caja.push({
                                        Nombre: material_adicional.nombre,
                                        Cantidad: cantidad
                                    })
                                }

                            }
                            if (material.grupo == '61fd72ecd9115415a4416f68') {
                                let material_adicional = DevolucionesDB[i].filtrado[x].material
                                let cantidad = Number((DevolucionesDB[i].filtrado[x].cantidad).toFixed(2))

                                let Existencia = Devolucion_Pega.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                if (Existencia != -1) {
                                    Devolucion_Pega[Existencia].Cantidad = Number(Devolucion_Pega[Existencia].Cantidad) + Number(cantidad)
                                    Devolucion_Pega[Existencia].Cantidad = (Devolucion_Pega[Existencia].Cantidad).toFixed(2)
                                } else {
                                    Devolucion_Pega.push({
                                        Nombre: material_adicional.nombre,
                                        Marca: material_adicional.marca,
                                        Cantidad: cantidad
                                    })
                                }
                                Devolucion_Total_pega = Number(Devolucion_Total_pega) + Number(cantidad);

                            }
                            // SUSTRATOOOO
                            if (material.grupo == '61f92a1f2126d717f004cca6') {

                                let material_adicional = DevolucionesDB[i].filtrado[x].material
                                let cantidad = Number((DevolucionesDB[i].filtrado[x].cantidad).toFixed(2))

                                let Existencia = Devolucion_Sustratos.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca && x.Ancho === material_adicional.ancho && x.Largo === material_adicional.largo && x.Calibre === material_adicional.calibre && x.Gramaje === material_adicional.gramaje)
                                let Peso = cantidad * material_adicional.gramaje * material_adicional.ancho * material_adicional.largo;
                                Peso = Peso / 10000000000;
                                Peso = Peso.toFixed(2);

                                if (Number(material_adicional.gramaje) < 100) {
                                    Papel_Devuelto = Number(Papel_Asignado) + Number(Peso)
                                    Papel_Devuelto = Papel_Devuelto.toFixed(2)
                                }
                                else {
                                    Carton_Devuelto = Number(Carton_Devuelto) + Number(Peso)
                                    Carton_Devuelto = Carton_Devuelto.toFixed(2)
                                }
                                if (Existencia != -1) {
                                    Devolucion_Sustratos[Existencia].Cantidad = Number(Devolucion_Sustratos[Existencia].Cantidad) + Number(cantidad)
                                    Devolucion_Sustratos[Existencia].Cantidad = (Devolucion_Sustratos[Existencia].Cantidad).toFixed(2)
                                    Devolucion_Sustratos[Existencia].Peso = Number(Devolucion_Sustratos[Existencia].Peso) + Number(Peso)
                                    Devolucion_Sustratos[Existencia].Peso = Devolucion_Sustratos[Existencia].Peso.toFixed(2)
                                } else {
                                    Devolucion_Sustratos.push({
                                        Nombre: material_adicional.nombre,
                                        Marca: material_adicional.marca,
                                        Ancho: material_adicional.ancho,
                                        Largo: material_adicional.largo,
                                        Gramaje: material_adicional.gramaje,
                                        Calibre: material_adicional.calibre,
                                        Cantidad: cantidad,
                                        Peso
                                    })
                                }

                            }
                            // SUSTRATOOOO
                            else {
                                let index = devoluciones_totales.findIndex(x => x.id === material._id)
                                if (index == -1) {
                                    devoluciones_totales.push({ Nombre: material.nombre, Marca: material.marca, Cantidad: cantidad, id: material._id, Ancho: material.ancho, Largo: material.largo, Calibre: material.calibre, Gramaje: material.gramaje })
                                } else {
                                    devoluciones_totales[index].Cantidad = Number(devoluciones_totales[index].Cantidad) + Number(cantidad);
                                    devoluciones_totales[index].Cantidad = Number(devoluciones_totales[index].Cantidad).toFixed(2)
                                }
                            }
                            // DEVOLUCIONES TOTALES
                            // //console.log(devoluciones_totales)
                            // DEVOLUCIONES TOTALES
                        }
                    }
                })

            Lotes.find(orden__)
                // Lotes.find({fecha:{$gte: desde,$lt: hasta}})
                .populate('material.material')
                .exec((err, adcionalesDB) => {
                    //console.log(trabajos)
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }

                    x++

                    for (let n = 0; n < adcionalesDB.length; n++) {
                        for (let n_i = 0; n_i < adcionalesDB[n].material.length; n_i++) {
                            let orden = adcionalesDB[n].orden
                            let material_adicional = adcionalesDB[n].material[n_i].material
                            let cantidad;
                            if (adcionalesDB[n].material[n_i].EA_Cantidad) {
                                cantidad = Number((adcionalesDB[n].material[n_i].EA_Cantidad).toFixed(2))
                            } else {
                                cantidad = adcionalesDB[n].material[n_i].cantidad
                            }
                            if (material_adicional) {
                                if (material_adicional.grupo == '61fd54e2d9115415a4416f17') {
                                    if (orden === '#') {
                                        switch (material_adicional.color) {
                                            case 'Amarillo':
                                                adicional_Amarillo = Number(adicional_Amarillo) + Number(cantidad)
                                                break;
                                            case 'Cyan':
                                                adicional_Cyan = Number(adicional_Cyan) + Number(cantidad)
                                                break;
                                            case 'Magenta':
                                                adicional_Magenta = Number(adicional_Magenta) + Number(cantidad)
                                                break;
                                            case 'Negro':
                                                adicional_Negro = Number(adicional_Negro) + Number(cantidad)
                                                break;
                                            default:
                                                adicional_Pantone = Number(adicional_Pantone) + Number(cantidad)
                                                break;
                                        }
                                        Total_Tintas_Adicionales = Number(Total_Tintas_Adicionales) + Number(cantidad)
                                        let Existencia = Adicionales.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                        if (Existencia != -1) {
                                            Adicionales[Existencia].Cantidad = Number(Adicionales[Existencia].Cantidad) + Number(cantidad)
                                            Adicionales[Existencia].Cantidad = (Adicionales[Existencia].Cantidad).toFixed(2)
                                        } else {
                                            Adicionales.push({
                                                Nombre: material_adicional.nombre,
                                                Marca: material_adicional.marca,
                                                Cantidad: Number(cantidad)
                                            })
                                        }
                                    } else {
                                        switch (material_adicional.color) {
                                            case 'Amarillo':
                                                Amarillo = Amarillo + Number(cantidad)
                                                break;
                                            case 'Cyan':
                                                Cyan = Cyan + Number(cantidad)
                                                break;
                                            case 'Magenta':
                                                Magenta = Magenta + Number(cantidad)
                                                break;
                                            case 'Negro':
                                                Negro = Negro + Number(cantidad)
                                                break;
                                            default:
                                                Pantone = Pantone + Number(cantidad)
                                                break;
                                        }
                                        Total_Tintas = Total_Tintas + Number(cantidad)
                                        let Existencia = Tintas.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                        if (Existencia != -1) {
                                            Tintas[Existencia].Cantidad = Number(Tintas[Existencia].Cantidad) + Number(cantidad)
                                            Tintas[Existencia].Cantidad = (Tintas[Existencia].Cantidad).toFixed(2)
                                        } else {
                                            Tintas.push({
                                                Nombre: material_adicional.nombre,
                                                Marca: material_adicional.marca,
                                                Cantidad: Number(cantidad)
                                            })
                                        }
                                    }
                                }
                                if (material_adicional.grupo == '61f92a1f2126d717f004cca6') {
                                    let cantidad = (Number(adcionalesDB[n].material[n_i].cantidad)).toFixed(2)
                                    let Existencia = Sustratos.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca && x.Ancho === material_adicional.ancho && x.Largo === material_adicional.largo && x.Calibre === material_adicional.calibre && x.Gramaje === material_adicional.gramaje)
                                    let Peso = cantidad * material_adicional.gramaje * material_adicional.ancho * material_adicional.largo;
                                    Peso = Peso / 10000000000;
                                    Peso = Peso.toFixed(2);

                                    if (Number(material_adicional.gramaje) < 100) {
                                        Papel_Asignado = Number(Papel_Asignado) + Number(Peso)
                                        Papel_Asignado = Papel_Asignado.toFixed(2)
                                    }
                                    else {
                                        Carton_Asignado = Number(Carton_Asignado) + Number(Peso)
                                        Carton_Asignado = Carton_Asignado.toFixed(2)
                                    }
                                    if (Existencia != -1) {
                                        Sustratos[Existencia].Cantidad = Number(Sustratos[Existencia].Cantidad) + Number(cantidad)
                                        Sustratos[Existencia].Cantidad = (Sustratos[Existencia].Cantidad).toFixed(2)
                                        Sustratos[Existencia].Peso = Number(Sustratos[Existencia].Peso) + Number(Peso)
                                        Sustratos[Existencia].Peso = Sustratos[Existencia].Peso.toFixed(2)
                                    } else {
                                        Sustratos.push({
                                            Nombre: material_adicional.nombre,
                                            Marca: material_adicional.marca,
                                            Ancho: material_adicional.ancho,
                                            Largo: material_adicional.largo,
                                            Gramaje: material_adicional.gramaje,
                                            Calibre: material_adicional.calibre,
                                            Cantidad: cantidad,
                                            Peso
                                        })
                                    }

                                }
                                if (material_adicional.grupo == '61fd6300d9115415a4416f60') {
                                    let material_adicional = adcionalesDB[n].material[n_i].material
                                    let cantidad;
                                    if (adcionalesDB[n].material[n_i].EA_Cantidad) {
                                        cantidad = Number((adcionalesDB[n].material[n_i].EA_Cantidad).toFixed(2))
                                    } else {
                                        cantidad = adcionalesDB[n].material[n_i].cantidad
                                    }

                                    let Existencia = Barniz.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                    if (Existencia != -1) {
                                        Barniz[Existencia].Cantidad = Number(Barniz[Existencia].Cantidad) + Number(cantidad)
                                        Barniz[Existencia].Cantidad = (Barniz[Existencia].Cantidad).toFixed(2)
                                    } else {
                                        Barniz.push({
                                            Nombre: material_adicional.nombre,
                                            Marca: material_adicional.marca,
                                            Cantidad: cantidad
                                        })
                                    }
                                    Total_barniz = Number(Total_barniz) + Number(cantidad);

                                }
                                if (material_adicional.grupo == '63625feecd436f1a90a1ea7d') {
                                    if (adcionalesDB[n].material[n_i].EA_Cantidad) {
                                        let material_adicional = adcionalesDB[n].material[n_i].material
                                        let cantidad = Number((adcionalesDB[n].material[n_i].EA_Cantidad).toFixed(2))
                                        let Existencia = Barniz_acuoso.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                        if (Existencia != -1) {
                                            Barniz_acuoso[Existencia].Cantidad = Number(Barniz_acuoso[Existencia].Cantidad) + Number(cantidad * 217.72)
                                            Barniz_acuoso[Existencia].Cantidad = Barniz_acuoso[Existencia].Cantidad
                                        } else {
                                            Barniz_acuoso.push({
                                                Nombre: material_adicional.nombre,
                                                Marca: material_adicional.marca,
                                                Cantidad: Number(cantidad * 217.72)
                                            })
                                        }
                                        Total_barniz_acuoso = Number(Total_barniz_acuoso) + Number(cantidad * 217.72);
                                        Total_barniz_acuoso = (Total_barniz_acuoso)
                                    }

                                }
                                if (material_adicional.grupo == '61fd72ecd9115415a4416f68') {
                                    let material_adicional = adcionalesDB[n].material[n_i].material
                                    let cantidad = (Number(adcionalesDB[n].material[n_i].cantidad)).toFixed(2)
                                    // //console.log(adcionalesDB[n].material[n_i])
                                    // //console.log(material_adicional.nombre,'-',material_adicional.neto)
                                    let Existencia = Pega.findIndex(x => x.Nombre === material_adicional.nombre && x.Marca === material_adicional.marca)
                                    if (Existencia != -1) {
                                        Pega[Existencia].Cantidad = Number(Pega[Existencia].Cantidad) + Number(cantidad * 20)
                                        Pega[Existencia].Cantidad = Pega[Existencia].Cantidad
                                    } else {
                                        Pega.push({
                                            Nombre: material_adicional.nombre,
                                            Marca: material_adicional.marca,
                                            Cantidad: Number(cantidad * 20)
                                        })
                                    }
                                    Total_Pega = Number(Total_Pega) + Number(cantidad * 20);
                                    Total_Pega = (Total_Pega)

                                }
                                if (material_adicional.grupo == '61fd7a8ed9115415a4416f74') {
                                    let material_adicional = adcionalesDB[n].material[n_i].material
                                    // //console.log(adcionalesDB[n].material[n_i])
                                    let cantidad = (Number(adcionalesDB[n].material[n_i].cantidad)).toFixed(2)
                                    // //console.log(material_adicional.nombre,'-',material_adicional.neto)
                                    let Existencia = Caja.findIndex(x => x.Nombre === material_adicional.nombre)
                                    if (Existencia != -1) {
                                        Caja[Existencia].Cantidad = Number(Caja[Existencia].Cantidad) + Number(cantidad)
                                        Caja[Existencia].Cantidad = Caja[Existencia].Cantidad
                                    } else {
                                        Caja.push({
                                            Nombre: material_adicional.nombre,
                                            Cantidad: Number(cantidad)
                                        })
                                    }

                                }
                            }
                        }
                        // if(adcionalesDB[n].material.material.grupo == '61fd54e2d9115415a4416f17'){
                        //         //console.log('yes')
                        //     }
                        Tintas = Tintas.sort(function (a, b) {
                            if (a.Nombre.toLowerCase() < b.Nombre.toLowerCase()) return -1
                            if (a.Nombre.toLowerCase() > b.Nombre.toLowerCase()) return 1
                            return 0

                        })
                        Adicionales = Adicionales.sort(function (a, b) {
                            if (a.Nombre.toLowerCase() < b.Nombre.toLowerCase()) return -1
                            if (a.Nombre.toLowerCase() > b.Nombre.toLowerCase()) return 1
                            return 0

                        })

                        Caja = Caja.sort(function (a, b) {
                            if (a.Nombre.toLowerCase() < b.Nombre.toLowerCase()) return -1
                            if (a.Nombre.toLowerCase() > b.Nombre.toLowerCase()) return 1
                            return 0

                        })
                        data = {
                            despachos,
                            Ordenes,
                            devoluciones,
                            devoluciones_totales,
                            Lotes: adcionalesDB,
                            Gestiones: gestiones,
                            Trabajos: trabajos,
                            Caja: {
                                Caja,
                                Devolucion_Caja
                            },
                            Pega: {
                                Pega,
                                Devolucion_Pega,
                                Devolucion_Total_pega,
                                Total_Pega
                            },
                            Barniz: {
                                Barniz,
                                Devolucion_Barniz,
                                Total_Barniz: (Total_barniz).toFixed(2),
                                Devolucion_Total_barniz: Devolucion_Total_barniz.toFixed(2),
                                Barniz_acuoso,
                                Total_barniz_acuoso: (Total_barniz_acuoso).toFixed(2)
                            },
                            Suma_de_tintas: (Number(Total_Tintas_Adicionales) + Number(Total_Tintas)).toFixed(2),
                            Colores_devueltos: {
                                Amarillo: Number(Devolucion_Amarillo).toFixed(2),
                                Cyan: Number(Devolucion_Cyan).toFixed(2),
                                Magenta: Number(Devolucion_Magenta).toFixed(2),
                                Negro: Number(Devolucion_Negro).toFixed(2),
                                Pantone: Number(Devolucion_Pantone).toFixed(2)
                            },
                            total_tintas_devueltas,
                            adicionales: {
                                Tintas: Adicionales,
                                detalle_tintas: {
                                    Amarillo: Number(adicional_Amarillo).toFixed(2),
                                    Cyan: Number(adicional_Cyan).toFixed(2),
                                    Magenta: Number(adicional_Magenta).toFixed(2),
                                    Negro: Number(adicional_Negro).toFixed(2),
                                    Pantone: Number(adicional_Pantone).toFixed(2)
                                },
                                Total: Number(Total_Tintas_Adicionales).toFixed(2),
                            },
                            asignados: {
                                Tintas,
                                detalle_tintas: {
                                    Amarillo: Number(Amarillo).toFixed(2),
                                    Cyan: Number(Cyan).toFixed(2),
                                    Magenta: Number(Magenta).toFixed(2),
                                    Negro: Number(Negro).toFixed(2),
                                    Pantone: Number(Pantone).toFixed(2)
                                },
                                Total: Number(Total_Tintas).toFixed(2),
                                Sustratos,
                                Devolucion_Sustratos,
                                Papel_Devuelto,
                                Carton_Devuelto,
                                Papel: Papel_Asignado,
                                Carton: Carton_Asignado
                            }
                        }
                    }
                    //console.log(data)
                    setTimeout(function () {
                        res.json(data)
                    }, 2000);
                })
        })

    // Orden.find({fecha:{
    //     $gte: desde,
    //     $lt: hasta
    // }}, (err, orden)=>{
    //     if( err ){
    //         return res.status(400).json({
    //             ok:false,
    //             err
    //         });
    //     }

    //     for(let i = 0; i<orden.length; i++){
    //         Despacho.find({"estado":"despachado", "despacho.op":orden[i].sort}, (err, DespachoDB)=>{
    //             if( err ){
    //                 return res.status(400).json({
    //                     ok:false,
    //                     err
    //                 });
    //             }
    //             for(let n = 0; n<DespachoDB.length; n++){
    //                 despachos.push(DespachoDB[n])
    //             }

    //             Trabajo.find({orden:orden[i]._id})
    //                     .populate('maquina')
    //                     .sort('pos')
    //                     .exec((err, Trabajos)=>{
    //                 if( err ){
    //                     return res.status(400).json({
    //                         ok:false,
    //                         err
    //                     });
    //                 }
    //                 for(let n = 0; n<Trabajos.length; n++){
    //                     trabajos.push(Trabajos[n])

    //                 }

    //                 Gestiones.find({op:orden[i]._id}, (err, GestinesDB)=>{
    //                     if( err ){
    //                         return res.status(400).json({
    //                             ok:false,
    //                             err
    //                         });
    //                     }

    //                     for(let n = 0; n<GestinesDB.length; n++){
    //                         gestiones.push(GestinesDB[n])
    //                     }

    //                     Requisicion.find({sort:orden[i].sort}, (err, RequisicionsDB)=>{
    //                         if( err ){
    //                             return res.status(400).json({
    //                                 ok:false,
    //                                 err
    //                             });
    //                         }

    //                         for(let n = 0; n<RequisicionsDB.length; n++){
    //                             requisiciones.push(RequisicionsDB[n])
    //                         }

    //                         Devolucion.find({orden:orden[i].sort})
    //                             .populate('filtrado.material')
    //                             .exec((err, DevolucionesDB)=>{
    //                             if( err ){
    //                                 return res.status(400).json({
    //                                     ok:false,
    //                                     err
    //                                 });
    //                             }

    //                             for(let n = 0; n<DevolucionesDB.length; n++){
    //                                 devoluciones.push(DevolucionesDB[n])
    //                             }

    //                             Lotes.find({orden:orden[i].sort})
    //                                 .populate('material.material')
    //                                 .exec((err, LotesDB)=>{
    //                                 if( err ){
    //                                     return res.status(400).json({
    //                                         ok:false,
    //                                         err
    //                                     });
    //                                 }

    //                                 x++
    //                                 for(let n = 0; n<LotesDB.length; n++){
    //                                     lotes.push(LotesDB[n])
    //                                 }



    //                                     if(x == orden.length){
    //                                         res.json({orden,despachos,trabajos,gestiones,requisiciones,devoluciones,lotes,Adicionales})
    //                                     }


    //                             })

    //                         })

    //                     })

    //                 })


    //             })


    //         })

    //     }

    // Despacho.find((err, despachos)=>{
    //     if( err ){
    //         return res.status(400).json({
    //             ok:false,
    //             err
    //         });
    //     }




    //     res.json({orden,despachos})
    // })

    // })

})

app.post('/api/reporte-inventario', async (req, res) => {
    try {
        const body = req.body;
        const desde = moment(body.desde);
        const hasta = moment(body.hasta).add(1, 'days');
        const grupo = body.grupo;

        const almacenDB = await Almacenado.find({ fecha: { $gte: desde, $lte: hasta } })
            .populate('material')
            .sort('material.nombre');

        const muestras = [];

        for (const almacenItem of almacenDB) {
            const loteDB = await Lotes.find({
                'material.material': almacenItem.material._id,
                'material.lote': almacenItem.lote,
                'material.codigo': almacenItem.codigo
            }).populate('material.material');

            if (loteDB.length > 0) {
                let coincidencias = false;

                for (const loteItem of loteDB) {
                    for (const materialItem of loteItem.material) {
                        if (
                            materialItem.material.nombre === almacenItem.material.nombre &&
                            materialItem.codigo === almacenItem.codigo &&
                            materialItem.lote === almacenItem.lote
                        ) {
                            muestras.push({
                                nombre: materialItem.material.nombre,
                                gramaje: materialItem.material.gramaje,
                                calibre: materialItem.material.calibre,
                                ancho: materialItem.material.ancho,
                                largo: materialItem.material.largo,
                                marca: materialItem.material.marca,
                                cantidad: materialItem.EA_Cantidad,
                                grupo: almacenItem.material.grupo
                            });
                            coincidencias = true;
                        }
                    }
                }

                if (!coincidencias) {
                    muestras.push({
                        nombre: almacenItem.material.nombre,
                        ancho: almacenItem.material.ancho,
                        largo: almacenItem.material.largo,
                        calibre: almacenItem.material.calibre,
                        gramaje: almacenItem.material.gramaje,
                        marca: almacenItem.material.marca,
                        cantidad: almacenItem.cantidad,
                        grupo: almacenItem.material.grupo
                    });
                }
            } else {
                muestras.push({
                    nombre: almacenItem.material.nombre,
                    ancho: almacenItem.material.ancho,
                    largo: almacenItem.material.largo,
                    calibre: almacenItem.material.calibre,
                    gramaje: almacenItem.material.gramaje,
                    marca: almacenItem.material.marca,
                    cantidad: almacenItem.cantidad,
                    grupo: almacenItem.material.grupo
                });
            }
        }

        setTimeout(() => {
            res.json(muestras);
        }, 2000);
    } catch (err) {
        res.status(400).json({
            ok: false,
            err
        });
    }
});

// app.post('/api/reporte-inventario', (req, res)=>{
//     let body = req.body

//     let desde = moment(body.desde)
//     let hasta = moment(body.hasta).add(1, 'days');
//     let grupo = body.grupo
//     let muestras = []

//     Almacenado.find({fecha:{$gte:desde, $lte:hasta}})
//         .populate('material')
//         .sort('material.nombre')
//         .exec((err, almacenDB)=>{
//         if( err ){
//             return res.status(400).json({
//                 ok:false,
//                 err
//             });
//         }

//         for(let i=0; i<almacenDB.length;i++){
//             Lotes.find({'material.material':almacenDB[i].material._id, 'material.lote':almacenDB[i].lote, 'material.codigo':almacenDB[i].codigo})
//             .populate('material.material')
//             .exec((err, loteDB)=>{
//                 if(loteDB.length>0){
//                     let coincidencias = false;
//                     for(let x=0;x<loteDB.length;x++){
//                         for(let y=0;y<loteDB[x].material.length;y++){

//                             if(loteDB[x].material[y].material.nombre == almacenDB[i].material.nombre && loteDB[x].material[y].codigo === almacenDB[i].codigo && loteDB[x].material[y].lote === almacenDB[i].lote){
//                                 muestras.push({nombre:`${loteDB[x].material[y].material.nombre}`,gramaje:loteDB[x].material[y].material.gramaje, calibre:loteDB[x].material[y].material.calibre, ancho:loteDB[x].material[y].material.ancho, largo:loteDB[x].material[y].material.largo, marca:loteDB[x].material[y].material.marca,cantidad:loteDB[x].material[y].EA_Cantidad, grupo:almacenDB[i].material.grupo})
//                                 coincidencias = true
//                             }

//                             if(x == loteDB.length-1){
//                                 if(y == loteDB[x].material.length -1){
//                                     if(!coincidencias){
//                                         muestras.push({nombre:almacenDB[i].material.nombre, ancho:almacenDB[i].material.ancho, largo:almacenDB[i].material.largo, calibre:almacenDB[i].material.calibre, gramaje:almacenDB[i].material.gramaje, marca:almacenDB[i].material.marca,cantidad:almacenDB[i].cantidad,grupo:almacenDB[i].material.grupo})
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }else{
//                     muestras.push({nombre:almacenDB[i].material.nombre, ancho:almacenDB[i].material.ancho, largo:almacenDB[i].material.largo, calibre:almacenDB[i].material.calibre, gramaje:almacenDB[i].material.gramaje, marca:almacenDB[i].material.marca,cantidad:almacenDB[i].cantidad,grupo:almacenDB[i].material.grupo})
//                 }
//             })
//             if(i === almacenDB.length -1 ){
//                 setTimeout(() => {
//                     res.json(muestras)
//                   }, 2000);
//             }
//         }
//         // for(let i=0; i<almacenDB.length;i++){
//         //         Lotes.find({'material.material':almacenDB[i].material._id, 'material.lote':almacenDB[i].lote, 'material.codigo':almacenDB[i].codigo})
//         //         .populate('material.material')
//         //         .exec((err, loteDB)=>{
//         //                 if(loteDB[0]){
//         //                     for(let n=0;n<loteDB[0].material.length;n++){
//         //                         if(loteDB[0].material[n].lote === almacenDB[i].lote){
//         //                             // //console.log('Lote:',loteDB[0].material[n].lote, '-', almacenDB[i].lote)
//         //                             if(loteDB[0].material[n].codigo === almacenDB[i].codigo){
//         //                             // //console.log('codigo:',loteDB[0].material[n].codigo, '-', almacenDB[i].codigo)
//         //                                 if(loteDB[0].material[n].material.nombre == almacenDB[i].material.nombre){
//         //                                 // //console.log('nombre:',loteDB[0].material[n].material.nombre,' ',loteDB[0].material[n].material.nombre )
//         //                                 // //console.log('nombre:',loteDB[0].material[n].EA_Cantidad,' ',almacenDB[i].cantidad )
//         //                                     muestras.push({nombre:`${loteDB[0].material[n].material.nombre}`,gramaje:loteDB[0].material[n].material.gramaje, calibre:loteDB[0].material[n].material.calibre, ancho:loteDB[0].material[n].material.ancho, largo:loteDB[0].material[n].material.largo, marca:loteDB[0].material[n].material.marca,cantidad:loteDB[0].material[n].EA_Cantidad, grupo:almacenDB[i].material.grupo})

//         //                                 }
//         //                             }
//         //                         }             
//         //                     }
//         //                 }else{
//         //                     muestras.push({nombre:almacenDB[i].material.nombre, ancho:almacenDB[i].material.ancho, largo:almacenDB[i].material.largo, calibre:almacenDB[i].material.calibre, gramaje:almacenDB[i].material.gramaje, marca:almacenDB[i].material.marca,cantidad:almacenDB[i].cantidad,grupo:almacenDB[i].material.grupo})
//         //                 }
//         //         })

//         //     if(i === almacenDB.length -1 ){
//         //         setTimeout(() => {
//         //             res.json(muestras)
//         //           }, 2000);
//         //     }

//         // }
//     })


// })

app.post('/api/reporte-salidas', (req, res) => {
    let body = req.body

    let desde = moment(body.desde)
    let hasta = moment(body.hasta).add(1, 'days');
    let muestras = []

    Lotes.find({ fecha: { $gte: desde, $lte: hasta } })
        .populate('material.material')
        .exec((err, salidas) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            //console.log(salidas)
            res.json(salidas)
        })
})

app.post('/api/reporte-devoluciones', (req, res) => {
    let body = req.body

    let desde = moment(body.desde)
    let hasta = moment(body.hasta).add(1, 'days');
    let muestras = []

    Devolucion.find({ fecha: { $gte: desde, $lte: hasta }, status: 'Culminado' })
        .populate('filtrado.material')
        .exec((err, devoluciones) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            // //console.log(devoluciones)
            res.json(devoluciones)
        })
})

app.post('/api/corte-de-fecha', async (req, res) => {
    try {
        const body = req.body;
        const desde = moment(body.desde).add(1, 'days');
        const hasta = moment(body.hasta).add(1, 'days');
        const muestras = [];

        const almacenDB = await Almacenado.find({ fecha: { $gte: desde, $lte: hasta } })
            .populate('material')
            .exec();

        for (const almacen of almacenDB) {
            const loteDB = await Lotes.find({
                'material.material': almacen.material._id,
                'material.lote': almacen.lote,
                'material.codigo': almacen.codigo
            })
                .populate('material.material')
                .exec();

            if (loteDB.length > 0) {
                let coincidencias = false;
                for (const lote of loteDB) {
                    for (const material of lote.material) {
                        if (
                            material.material.nombre === almacen.material.nombre &&
                            material.codigo === almacen.codigo &&
                            material.lote === almacen.lote
                        ) {
                            muestras.push({
                                nombre: material.material.nombre,
                                gramaje: material.material.gramaje,
                                calibre: material.material.calibre,
                                ancho: material.material.ancho,
                                largo: material.material.largo,
                                marca: material.material.marca,
                                cantidad: material.EA_Cantidad,
                                grupo: almacen.material.grupo
                            });
                            coincidencias = true;
                        }
                    }
                }
                if (!coincidencias) {
                    muestras.push({
                        nombre: almacen.material.nombre,
                        ancho: almacen.material.ancho,
                        largo: almacen.material.largo,
                        calibre: almacen.material.calibre,
                        gramaje: almacen.material.gramaje,
                        marca: almacen.material.marca,
                        cantidad: almacen.cantidad,
                        grupo: almacen.material.grupo
                    });
                }
            } else {
                muestras.push({
                    nombre: almacen.material.nombre,
                    ancho: almacen.material.ancho,
                    largo: almacen.material.largo,
                    calibre: almacen.material.calibre,
                    gramaje: almacen.material.gramaje,
                    marca: almacen.material.marca,
                    cantidad: almacen.cantidad,
                    grupo: almacen.material.grupo
                });
            }
        }

        res.json(muestras);
    } catch (err) {
        console.error(err);
        res.status(400).json({ ok: false, err });
    }
});

// app.post('/api/corte-de-fecha', (req, res)=>{
//     let body = req.body

//     let desde = moment(body.desde)
//     let hasta = moment(body.hasta).add(1, 'days');

//     let muestras = []

//     Almacenado.find({fecha:{$gte:desde}})
//         .populate('material')
//         .exec((err, almacenDB)=>{
//         if( err ){
//             return res.status(400).json({
//                 ok:false,
//                 err
//             });
//         }

//         for(let i=0; i<almacenDB.length;i++){
//             Lotes.find({'material.material':almacenDB[i].material._id, 'material.lote':almacenDB[i].lote, 'material.codigo':almacenDB[i].codigo})
//             .populate('material.material')
//             .exec((err, loteDB)=>{
//                 if(loteDB.length>0){
//                     let coincidencias = false;
//                     for(let x=0;x<loteDB.length;x++){
//                         for(let y=0;y<loteDB[x].material.length;y++){

//                             if(loteDB[x].material[y].material.nombre == almacenDB[i].material.nombre && loteDB[x].material[y].codigo === almacenDB[i].codigo && loteDB[x].material[y].lote === almacenDB[i].lote){
//                                 muestras.push({nombre:`${loteDB[x].material[y].material.nombre}`,gramaje:loteDB[x].material[y].material.gramaje, calibre:loteDB[x].material[y].material.calibre, ancho:loteDB[x].material[y].material.ancho, largo:loteDB[x].material[y].material.largo, marca:loteDB[x].material[y].material.marca,cantidad:loteDB[x].material[y].EA_Cantidad, grupo:almacenDB[i].material.grupo})
//                                 coincidencias = true
//                             }

//                             if(x == loteDB.length-1){
//                                 if(y == loteDB[x].material.length -1){
//                                     if(!coincidencias){
//                                         muestras.push({nombre:almacenDB[i].material.nombre, ancho:almacenDB[i].material.ancho, largo:almacenDB[i].material.largo, calibre:almacenDB[i].material.calibre, gramaje:almacenDB[i].material.gramaje, marca:almacenDB[i].material.marca,cantidad:almacenDB[i].cantidad,grupo:almacenDB[i].material.grupo})
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }else{
//                     muestras.push({nombre:almacenDB[i].material.nombre, ancho:almacenDB[i].material.ancho, largo:almacenDB[i].material.largo, calibre:almacenDB[i].material.calibre, gramaje:almacenDB[i].material.gramaje, marca:almacenDB[i].material.marca,cantidad:almacenDB[i].cantidad,grupo:almacenDB[i].material.grupo})
//                 }
//             })
//             if(i === almacenDB.length -1 ){
//                 setTimeout(() => {
//                     res.json(muestras)
//                   }, 4000);
//             }
//         }
//         // for(let i=0; i<almacenDB.length;i++){
//         //         Lotes.find({'material.material':almacenDB[i].material._id, 'material.lote':almacenDB[i].lote, 'material.codigo':almacenDB[i].codigo})
//         //         .populate('material.material')
//         //         .exec((err, loteDB)=>{
//         //                 if(loteDB[0]){
//         //                     for(let n=0;n<loteDB[0].material.length;n++){
//         //                         if(loteDB[0].material[n].lote === almacenDB[i].lote){
//         //                             // //console.log('Lote:',loteDB[0].material[n].lote, '-', almacenDB[i].lote)
//         //                             if(loteDB[0].material[n].codigo === almacenDB[i].codigo){
//         //                             // //console.log('codigo:',loteDB[0].material[n].codigo, '-', almacenDB[i].codigo)
//         //                                 if(loteDB[0].material[n].material.nombre == almacenDB[i].material.nombre){
//         //                                 // //console.log('nombre:',loteDB[0].material[n].material.nombre,' ',loteDB[0].material[n].material.nombre )
//         //                                 // //console.log('nombre:',loteDB[0].material[n].EA_Cantidad,' ',almacenDB[i].cantidad )
//         //                                     muestras.push({nombre:loteDB[0].material[n].material.nombre, gramaje:loteDB[0].material[n].material.gramaje, calibre:loteDB[0].material[n].material.calibre, ancho:loteDB[0].material[n].material.ancho, largo:loteDB[0].material[n].material.largo, marca:loteDB[0].material[n].material.marca,cantidad:loteDB[0].material[n].EA_Cantidad, grupo:almacenDB[i].material.grupo})
//         //                                 }
//         //                             }
//         //                         }             
//         //                     }
//         //                 }else{
//         //                     muestras.push({nombre:almacenDB[i].material.nombre, ancho:almacenDB[i].material.ancho, largo:almacenDB[i].material.largo, calibre:almacenDB[i].material.calibre, gramaje:almacenDB[i].material.gramaje, marca:almacenDB[i].material.marca,cantidad:almacenDB[i].cantidad,grupo:almacenDB[i].material.grupo})
//         //                 }
//         //         })

//         //     if(i === almacenDB.length -1 ){
//         //         setTimeout(() => {
//         //             res.json(muestras)
//         //           }, 4000);
//         //     }

//         // }
//     })

// })

app.post('/api/corte-salida', (req, res) => {
    let body = req.body

    let desde = moment(body.desde)
    let hasta = moment(body.hasta).add(1, 'days');
    let muestras = []

    Lotes.find({ fecha: { $gte: desde, $lte: hasta } })
        .populate('material.material')
        .exec((err, salidas) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            //console.log(salidas)
            res.json(salidas)
        })
})

app.post('/api/corte-devolucion', (req, res) => {
    let body = req.body

    let desde = moment(body.desde)
    let hasta = moment(body.hasta).add(1, 'days');
    let muestras = []

    Devolucion.find({ fecha: { $gte: desde, $lte: hasta }, status: 'Culminado' })
        .populate('filtrado.material')
        .exec((err, devoluciones) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            //console.log(devoluciones)
            res.json(devoluciones)
        })
})



app.post("/api/inventario-final", async (req, res) => {
    try {
        const { desde, hasta } = req.body;
        const start = moment(desde).startOf("day").toDate();
        const end = moment(hasta).endOf("day").toDate();

        // Traemos los registros de almacén (saldo final)
        const almacen = await Almacenado.find({
            fecha: { $gte: start, $lte: end },
        })
            .populate("material")
            .lean();

        // Entradas y salidas
        const lotes = await Lotes.find({
            fecha: { $gte: start, $lte: end },
        })
            .populate("material.material")
            .lean();

        // Devoluciones
        const devoluciones = await Devolucion.find({
            fecha: { $gte: start, $lte: end },
        })
            .populate("filtrado.material")
            .lean();

        const resultado = [];

        for (const item of almacen) {
            const nombre = item.material?.nombre || "Desconocido";
            const saldoFinal = Number(item.cantidad) || 0;

            const entradas = lotes
                .flatMap((l) => l.material)
                .filter((m) => m?.material?.nombre === nombre)
                .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);

            const salidas = lotes
                .flatMap((l) => l.material)
                .filter((m) => m?.material?.nombre === nombre && m.tipo === "salida")
                .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);

            const devs = devoluciones
                .flatMap((d) => d.filtrado)
                .filter((f) => f?.material?.nombre === nombre)
                .reduce((sum, f) => sum + (Number(f.cantidad) || 0), 0);

            // 🧮 Cálculo del saldo inicial:
            const saldoInicial = saldoFinal - entradas + salidas + devs;

            resultado.push({
                nombre,
                saldoInicial: saldoInicial.toFixed(2),
                entradas: entradas.toFixed(2),
                salidas: salidas.toFixed(2),
                devoluciones: devs.toFixed(2),
                saldoFinal: saldoFinal.toFixed(2),
            });
        }

        res.json(resultado);
    } catch (error) {
        console.error("Error inventario:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
});


// GET /api/lotes/salidas?inicio=2025-11-01&fin=2025-11-10
app.get('/api/movimientos', async (req, res) => {
    try {
        const { inicio, fin } = req.query;

        if (!inicio || !fin) {
            return res.status(400).json({
                error: 'Debes enviar las fechas inicio y fin (formato YYYY-MM-DD)',
            });
        }

        const fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        fechaFin.setHours(23, 59, 59, 999);

        // ===================== MOVIMIENTOS =====================
        const pipelineMovimientos = [
            // --- SALIDAS desde "Lotes" ---
            { $match: { fecha: { $gte: fechaInicio, $lte: fechaFin } } },
            { $unwind: '$material' },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'material.material',
                    foreignField: '_id',
                    as: 'material_detalle',
                },
            },
            { $unwind: '$material_detalle' },
            {
                $addFields: {
                    cantidad_num: {
                        $convert: {
                            input: { $ifNull: ['$material.cantidad', 0] },
                            to: 'double',
                            onError: 0,
                            onNull: 0,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        material_id: '$material_detalle._id',
                        nombre: '$material_detalle.nombre',
                        marca: '$material_detalle.marca',
                        gramaje: '$material_detalle.gramaje',
                        calibre: '$material_detalle.calibre',
                        ancho: '$material_detalle.ancho',
                        largo: '$material_detalle.largo',
                        unidad: '$material_detalle.unidad',
                    },
                    salidas: { $sum: '$cantidad_num' },
                },
            },
            {
                $project: {
                    _id: 0,
                    material_id: '$_id.material_id',
                    nombre: '$_id.nombre',
                    marca: '$_id.marca',
                    gramaje: '$_id.gramaje',
                    calibre: '$_id.calibre',
                    ancho: '$_id.ancho',
                    largo: '$_id.largo',
                    unidad: '$_id.unidad',
                    salidas: 1,
                    entradas: { $literal: 0 },
                    devoluciones: { $literal: 0 },
                },
            },

            // --- ENTRADAS desde "almacenados" ---
            {
                $unionWith: {
                    coll: 'almacenados',
                    pipeline: [
                        { $match: { fecha: { $gte: fechaInicio, $lte: fechaFin } } },
                        {
                            $lookup: {
                                from: 'materials',
                                localField: 'material',
                                foreignField: '_id',
                                as: 'material_detalle',
                            },
                        },
                        { $unwind: '$material_detalle' },
                        {
                            $addFields: {
                                cantidad_num: {
                                    $convert: {
                                        input: { $ifNull: ['$cantidad', 0] },
                                        to: 'double',
                                        onError: 0,
                                        onNull: 0,
                                    },
                                },
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    material_id: '$material_detalle._id',
                                    nombre: '$material_detalle.nombre',
                                    marca: '$material_detalle.marca',
                                    gramaje: '$material_detalle.gramaje',
                                    calibre: '$material_detalle.calibre',
                                    ancho: '$material_detalle.ancho',
                                    largo: '$material_detalle.largo',
                                    unidad: '$material_detalle.unidad',
                                },
                                entradas: { $sum: '$cantidad_num' },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                material_id: '$_id.material_id',
                                nombre: '$_id.nombre',
                                marca: '$_id.marca',
                                gramaje: '$_id.gramaje',
                                calibre: '$_id.calibre',
                                ancho: '$_id.ancho',
                                largo: '$_id.largo',
                                unidad: '$_id.unidad',
                                entradas: 1,
                                salidas: { $literal: 0 },
                                devoluciones: { $literal: 0 },
                            },
                        },
                    ],
                },
            },

            // --- DEVOLUCIONES desde "devolucions" ---
            {
                $unionWith: {
                    coll: 'devolucions',
                    pipeline: [
                        { $match: { fecha: { $gte: fechaInicio, $lte: fechaFin } } },
                        { $unwind: '$filtrado' },
                        {
                            $lookup: {
                                from: 'materials',
                                localField: 'filtrado.material',
                                foreignField: '_id',
                                as: 'material_detalle',
                            },
                        },
                        { $unwind: '$material_detalle' },
                        {
                            $addFields: {
                                cantidad_num: {
                                    $convert: {
                                        input: { $ifNull: ['$filtrado.cantidad', 0] },
                                        to: 'double',
                                        onError: 0,
                                        onNull: 0,
                                    },
                                },
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    material_id: '$material_detalle._id',
                                    nombre: '$material_detalle.nombre',
                                    marca: '$material_detalle.marca',
                                    gramaje: '$material_detalle.gramaje',
                                    calibre: '$material_detalle.calibre',
                                    ancho: '$material_detalle.ancho',
                                    largo: '$material_detalle.largo',
                                    unidad: '$material_detalle.unidad',
                                },
                                devoluciones: { $sum: '$cantidad_num' },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                material_id: '$_id.material_id',
                                nombre: '$_id.nombre',
                                marca: '$_id.marca',
                                gramaje: '$_id.gramaje',
                                calibre: '$_id.calibre',
                                ancho: '$_id.ancho',
                                largo: '$_id.largo',
                                unidad: '$_id.unidad',
                                entradas: { $literal: 0 },
                                salidas: { $literal: 0 },
                                devoluciones: 1,
                            },
                        },
                    ],
                },
            },

            // --- Agrupar todo ---
            {
                $group: {
                    _id: {
                        material_id: '$material_id',
                        nombre: '$nombre',
                        marca: '$marca',
                        gramaje: '$gramaje',
                        calibre: '$calibre',
                        ancho: '$ancho',
                        largo: '$largo',
                        unidad: '$unidad',
                    },
                    entradas: { $sum: '$entradas' },
                    salidas: { $sum: '$salidas' },
                    devoluciones: { $sum: '$devoluciones' },
                },
            },
            {
                $project: {
                    _id: 0,
                    material_id: '$_id.material_id',
                    nombre: '$_id.nombre',
                    marca: '$_id.marca',
                    gramaje: '$_id.gramaje',
                    calibre: '$_id.calibre',
                    ancho: '$_id.ancho',
                    largo: '$_id.largo',
                    unidad: '$_id.unidad',
                    entradas: 1,
                    salidas: 1,
                    devoluciones: 1,
                },
            },
            { $sort: { nombre: 1 } },
        ];

        const movimientos = await Lotes.aggregate(pipelineMovimientos);

        // ===================== STOCK ACTUAL =====================
        const stockActual = await mongoose.connection
            .collection('almacenados')
            .aggregate([
                {
                    $lookup: {
                        from: 'materials',
                        localField: 'material',
                        foreignField: '_id',
                        as: 'material_detalle',
                    },
                },
                { $unwind: '$material_detalle' },
                {
                    $addFields: {
                        cantidad_num: {
                            $convert: {
                                input: { $ifNull: ['$cantidad', 0] },
                                to: 'double',
                                onError: 0,
                                onNull: 0,
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: '$material_detalle._id',
                        stock_actual: { $sum: '$cantidad_num' },
                    },
                },
            ])
            .toArray();

        // ===================== MEZCLAR RESULTADOS =====================
        const resultadoFinal = movimientos.map((mov) => {
            const stock = stockActual.find(
                (s) => s._id.toString() === mov.material_id.toString()
            );
            const saldo_final = stock ? stock.stock_actual : 0;

            // Aplicamos la fórmula correcta:
            // Inventario inicial = Inventario final - (Entradas + Devoluciones - Salidas)
            const saldo_inicial = saldo_final - (mov.entradas + mov.devoluciones - mov.salidas);

            return {
                ...mov,
                saldo_inicial,
                saldo_final,
            };
        });

        // ===================== RESPUESTA =====================
        res.json({
            rango: { inicio: fechaInicio, fin: fechaFin },
            total_tipos: resultadoFinal.length,
            movimientos: resultadoFinal,
        });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});



module.exports = app;