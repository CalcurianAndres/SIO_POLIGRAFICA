const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var LoteSchema = new mongoose.Schema({
    orden: { type: String, required: true },
    asignacion: { type: String, required: true },
    cerrado: { type: Boolean },
    material: [
        {
            material: {
                type: Schema.Types.ObjectId,
                ref: 'material'
            },
            lote: { type: String },
            codigo: { type: String },
            cantidad: { type: String },
            EA_Cantidad: { type: Number },
            asignacion: { type: String }
        }
    ],
    fecha: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

LoteSchema.plugin(mongologger());

module.exports = mongoose.model('lote', LoteSchema)