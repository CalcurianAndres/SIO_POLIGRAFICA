const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var IRepuestoschema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 240000 }
}, {
    timestamps: true
});

IRepuestoschema.plugin(mongologger());

module.exports = mongoose.model('irepuestos', IRepuestoschema)