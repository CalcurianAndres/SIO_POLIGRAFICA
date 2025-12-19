const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var Icotizacionschema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1 }
}, {
    timestamps: true
});

Icotizacionschema.plugin(mongologger());

module.exports = mongoose.model('icotizacion', Icotizacionschema)