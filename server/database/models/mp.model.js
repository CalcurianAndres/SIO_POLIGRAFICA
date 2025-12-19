const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let MateriaSchema = new Schema([{

    nombre: {
        type: String,
        required: true
    }
}], {
    timestamps: true
});

MateriaSchema.plugin(mongologger());


module.exports = mongoose.model('materia', MateriaSchema)