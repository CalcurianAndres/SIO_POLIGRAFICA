const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var iasignacionrepuesto = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 240000 }
}, {
    timestamps: true
});

iasignacionrepuesto.plugin(mongologger());

module.exports = mongoose.model('iasignacionr', iasignacionrepuesto)