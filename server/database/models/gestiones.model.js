const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let GestionSchema = new Schema([{

    fecha: {
        type: String,
        required: true
    },
    maquina: {
        type: Schema.Types.ObjectId,
        ref: 'maquina'
    },
    orden: {
        type: Schema.Types.ObjectId,
        ref: 'trabajos'
    },
    productos: {
        type: String,
        required: true
    },
    hojas: {
        type: String,
        required: true
    },
    Rproductos: {
        type: String,
        required: true
    },
    Rhojas: {
        type: String,
        required: true
    },
    op: {
        type: Schema.Types.ObjectId,
        ref: 'orden'
    },
    Impreso: {
        type: String
    },
    Resto: {
        type: String
    },


}], {
    timestamps: true
});

GestionSchema.plugin(mongologger());


module.exports = mongoose.model('gestion', GestionSchema)