const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let IngresosNSchema = new Schema([{

    fecha: {
        type: Date,
        default: Date.now
    },
    material: {
        type: Schema.Types.ObjectId,
        ref: 'material'
    }

}], {
    timestamps: true
});

IngresosNSchema.plugin(mongologger());


module.exports = mongoose.model('ingresosNew', IngresosNSchema)