const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let EscalaSchema = new Schema([{

    producto: {
        type: Schema.Types.ObjectId,
        ref: 'producto'
    },
    descripcion: {
        type: String,
        required: true
    },
    montaje: {
        type: Number,
        required: true
    },
    escalas: {
        type: Array,
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'producto'
    },
    fecha: {
        type: Date,
        default: Date.now
    }

}], {
    timestamps: true
});

EscalaSchema.plugin(mongologger());


module.exports = mongoose.model('escala', EscalaSchema)