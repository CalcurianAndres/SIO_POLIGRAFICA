const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var IfacturacionSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 230000 }
}, {
    timestamps: true
});

IfacturacionSchema.plugin(mongologger());

module.exports = mongoose.model('ifacturacion', IfacturacionSchema)