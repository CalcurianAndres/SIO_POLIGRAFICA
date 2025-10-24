const mongoose = require('mongoose');

let Schema = mongoose.Schema;

var Icotizacionschema = new mongoose.Schema({
    _id: {type: String, required:true},
    seq: {type: Number, default: 1}
});

module.exports = mongoose.model('icotizacion', Icotizacionschema)