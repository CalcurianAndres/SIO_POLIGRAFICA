const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let GrupoSchema = new Schema([{

    nombre: {
        type: String,
        required: true
    },
    tipos: {
        type: Array,
        required: true
    }

}], {
    timestamps: true
});

GrupoSchema.plugin(mongologger());


module.exports = mongoose.model('grupo', GrupoSchema)