const mongoose = require('mongoose');
const mongoLogger = require('../../middlewares/mongologger');


let Schema = mongoose.Schema;

let AlmacenadoSchema = new Schema({

    material: {
        type: Schema.Types.ObjectId,
        ref: 'material'
    },
    codigo: {
        type: String
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
    almacen: {
        type: String
    },
    observacion: {
        type: String
    }

}, {
    timestamps: true
});

AlmacenadoSchema.plugin(mongoLogger());


module.exports = mongoose.model('almacenadoExterno', AlmacenadoSchema)