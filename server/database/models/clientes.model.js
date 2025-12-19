const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let ClienteSchema = new Schema([{

    nombre: {
        type: String,
        required: true
    },
    codigo: {
        type: String,
        required: true
    },
    almacenes: {
        type: Array,
    },
    rif: {
        type: String
    },
    direccion: {
        type: String
    },
    contactos: {
        type: Array
    },
    fecha: {
        type: Date,
        default: Date.now
    }

}], {
    timestamps: true
});

ClienteSchema.plugin(mongologger());


module.exports = mongoose.model('cliente', ClienteSchema)