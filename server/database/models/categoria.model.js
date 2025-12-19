const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let CategoriaSchema = new Schema([{
    nombre: {
        type: String
    }
}], {
    timestamps: true
});

CategoriaSchema.plugin(mongologger());

module.exports = mongoose.model('categoria', CategoriaSchema)