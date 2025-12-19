const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var RequisicionSchema = new mongoose.Schema({
    sort: { type: String, required: true },
    estado: { type: String, default: 'Espera' },
    montaje: { type: Number, default: 0 },
    paginas: { type: Number, default: 1000 },
    cantidad: { type: Number, default: 1 },
    solicitud: { type: Number, default: 0 },
    motivo: { type: String },
    usuario: { type: String },
    producto: {
        producto: { type: String },
        materiales: [
            [
                {
                    cantidad: { type: Number },
                    producto: {
                        type: Schema.Types.ObjectId,
                        ref: 'material'
                    }
                }
            ]
        ]
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});


// RequisicionSchema.createIndex({ estado: 1 })

RequisicionSchema.plugin(mongologger());

module.exports = mongoose.model('requisicion', RequisicionSchema)