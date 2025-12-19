const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');
let Schema = mongoose.Schema;

let asustratoSchema = new Schema([{

    lote: {
        type: String,
        required: true
    },
    ancho: {
        type: String,
    },
    largo: {
        type: String
    },
    muestras: {
        type: Number
    },
    observacion: {
        type: String
    },
    resultado: {
        type: String
    },
    validado: {
        type: String
    },
    validacion: {
        type: String
    },
    realizado: {
        type: String
    },
    realizacion: {
        type: String
    },
    gramaje: {
        promedio: { type: String },
        desviacion: { type: String },
        masa_inicial: { type: Array },
        masa_final: { type: Array },
        gramaje: { type: Array },
        nf: { type: String }
    },
    cobb: {
        promedio_top: { type: String },
        desviacion_top: { type: String },
        promedio_back: { type: String },
        desviacion_back: { type: String },
        cobb: { type: Array },
        max_top: { type: String },
        min_top: { type: String },
        max_back: { type: String },
        min_back: { type: String },
        nf: { type: String }
    },
    calibre: {
        mm: { type: Array },
        um: { type: Array },
        pt: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        promedio_um: { type: String },
        desviacion_um: { type: String },
        promedio_pt: { type: String },
        desviacion_pt: { type: String },
        nf: { type: String },
        nf_um: { type: String },
        nf_pt: { type: String }
    },
    curling: {
        curling: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        nf: { type: String }
    },
    blancura: {
        blancura: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        nf: { type: String }
    },
    escuadra: {
        escuadra: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        max_escuadra: { type: String },
        min_escuadra: { type: String },
        nf: { type: String }
    },
    contra_escuadra: {
        contra_escuadra: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        min_contra_escuadra: { type: String },
        max_contra_escuadra: { type: String },
        nf: { type: String }
    },
    pinza: {
        pinza: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        min_pinza: { type: String },
        max_pinza: { type: String },
        nf: { type: String }
    },
    contra_pinza: {
        contra_pinza: { type: Array },
        promedio: { type: String },
        desviacion: { type: String },
        min_contra_pinza: { type: String },
        max_contra_pinza: { type: String },
        nf: { type: String }
    }





}], {
    timestamps: true
});

asustratoSchema.plugin(mongologger());

module.exports = mongoose.model('asustrato', asustratoSchema)