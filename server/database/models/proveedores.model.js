const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let ProveedorSchema = new Schema([{
    nombre: {
        type: String,
        required: true
    },
    direccion: {
        type: String,
    },
    rif: {
        type: String,
    },
    grupo: {

        type: Array,
    },
    contactos: {
        type: Array,
    },
    fabricantes: {
        type: Array,
    },
    logo: {
        type: String,
        default: 'no-image'
    }

}], {
    timestamps: true
});

ProveedorSchema.plugin(mongologger());

module.exports = mongoose.model('proveedor', ProveedorSchema)