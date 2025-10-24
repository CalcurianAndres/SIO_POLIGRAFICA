const mongoose = require('mongoose');

let Schema = mongoose.Schema;

var IfacturacionSchema = new mongoose.Schema({
    _id: {type: String, required:true},
    seq: {type: Number, default: 230000}
});

module.exports = mongoose.model('ifacturacion', IfacturacionSchema)