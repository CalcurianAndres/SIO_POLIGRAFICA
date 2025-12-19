const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var Idevolucionschema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 2021000 }
}, {
    timestamps: true
});

Idevolucionschema.plugin(mongologger());

module.exports = mongoose.model('idevolucion', Idevolucionschema)