const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let IngresosSchema = new Schema([{

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

IngresosSchema.plugin(mongologger());


module.exports = mongoose.model('ingresos', IngresosSchema)