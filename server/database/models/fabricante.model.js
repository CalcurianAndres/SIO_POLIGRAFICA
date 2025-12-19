const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let FabricanteSchema = new Schema([{
    nombre: {
        type: String,
        required: true
    },
    alias: {
        type: String,
        required: true
    },
    origenes: {
        type: Array,
    },
    grupo: {
        type: Array,
    },
    logo: {
        type: String,
        default: 'no-image'
    },

}], {
    timestamps: true
});

FabricanteSchema.plugin(mongologger());

module.exports = mongoose.model('fabricante', FabricanteSchema)