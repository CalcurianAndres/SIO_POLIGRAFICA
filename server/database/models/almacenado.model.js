const mongoose = require('mongoose');
const mongoLogger = require('../../middlewares/mongologger');


let Schema = mongoose.Schema;

let AlmacenadoSchema = new Schema({

    material: {
        type: Schema.Types.ObjectId,
        ref: 'material'
    },
    codigo: {
        type: String,
        required: true
    },
    lote: {
        type: String,
        required: true
    },
    cantidad: {
        type: String,
        required: true
    },
    pedido: {
        type: String,
    },
    precio: {
        type: Number
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    fuera: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


// Índices compuestos (MUY IMPORTANTE para tu query)
AlmacenadoSchema.index({ cantidad: 1, fuera: 1 });
AlmacenadoSchema.index({ material: 1 });

AlmacenadoSchema.plugin(mongoLogger());



module.exports = mongoose.model('almacenado', AlmacenadoSchema)