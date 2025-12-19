const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let BobinaSchema = new Schema([{

    Nbobina: {
        type: String,
        required: true
    },
    material: {
        type: String,
        required: true
    },
    marca: {
        type: String,
        required: true
    },
    gramaje: {
        type: String,
        required: true
    },
    ancho: {
        type: String,
        required: true
    },
    calibre: {
        type: String,
        required: true
    }
    ,
    peso: {
        type: String,
        required: true
    },
    lote: {
        type: String,
        required: true
    },
    convertidora: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }

}], {
    timestamps: true
});

BobinaSchema.plugin(mongologger());


module.exports = mongoose.model('bobina', BobinaSchema)