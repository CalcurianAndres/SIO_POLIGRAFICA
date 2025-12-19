const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let ordendecompraSchema = new Schema([{

    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'cliente'
    },
    orden: {
        type: String,
        required: true
    },
    fecha_entrega: {
        type: String,
        required: true
    },
    fecha_recepcion: {
        type: String,
        required: true
    },
    productos: [
        {
            producto: {
                type: Schema.Types.ObjectId,
                ref: 'producto'
            },
            cantidad: {
                type: String,
                required: true
            },
            fecha: {
                type: String,
                required: true
            },
            status: {
                type: String,
            }
        }
    ]

}], {
    timestamps: true
});

ordendecompraSchema.plugin(mongologger());


module.exports = mongoose.model('ordendecompra', ordendecompraSchema)