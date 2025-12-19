const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let DescuentoSchema = new Schema([{

    fecha: {
        type: Date,
        default: Date.now
    },
    material: {
        type: Schema.Types.ObjectId,
        ref: 'material'
    },
    descuento: {
        type: Number
    },
    razon: {
        type: String
    }

}], {
    timestamps: true
});

DescuentoSchema.plugin(mongologger());


module.exports = mongoose.model('descuentos', DescuentoSchema)