const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var ISolicitudSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 2021000 }
}, {
    timestamps: true
});

ISolicitudSchema.plugin(mongologger());

module.exports = mongoose.model('isolicitud', ISolicitudSchema)