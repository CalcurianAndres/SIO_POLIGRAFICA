const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let DepartamentoSchema = new Schema([{

    fecha: {
        type: Date,
        default: Date.now
    },
    departamento: {
        type: String
    },
    roles: {
        type: Array
    },

}], {
    timestamps: true
});

DepartamentoSchema.plugin(mongologger());


module.exports = mongoose.model('departamento', DepartamentoSchema)