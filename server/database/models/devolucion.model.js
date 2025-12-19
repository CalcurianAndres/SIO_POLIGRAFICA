const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let DevolucionSchema = new Schema([{

    orden: {
        type: String
    },
    filtrado: [
        {
            material: {
                type: Schema.Types.ObjectId,
                ref: 'material'
            },
            lote: {
                type: String
            },
            codigo: {
                type: String
            },
            cantidad: {
                type: Number
            }
        }
    ]
    ,
    motivo: {
        type: String
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: String
    },
    status: {
        type: String,
        default: 'Pendiente'
    }

}], {
    timestamps: true
});

DevolucionSchema.plugin(mongologger());


module.exports = mongoose.model('devolucion', DevolucionSchema)