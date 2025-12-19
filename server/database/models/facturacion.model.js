const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;


let FacturacionSchema = new Schema([{
    status: {
        type: String,
        default: 'Por notificar'
    },
    factura: {
        type: String,
        required: true
    },
    orden: {
        type: String,
    },
    recepcion: {
        type: String,
    },
    transportista: {
        type: String,
    },
    productos: [
        {
            material: { type: Schema.Types.ObjectId, ref: 'materiales' },
            nombre: { type: String, },
            marca: { type: String, },
            fabricacion: { type: String, },
            capacidad: { type: String, },
            lote: { type: String, },
            numero: { type: String, }
        }
    ],
    totales: {
        type: Array,
    },
    condicion: {
        type: Array,
    },
    proveedor: {
        type: Schema.Types.ObjectId,
        ref: 'proveedor'
    },
    observacion: {
        type: String,
    },
    usuario: {
        type: String,
    },
    creacion: {
        type: String,
    }

}], {
    timestamps: true
});

FacturacionSchema.plugin(mongologger());
module.exports = mongoose.model('facturacion', FacturacionSchema)