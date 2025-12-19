const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var SolicitudesSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number }
}, {
    timestamps: true
});

SolicitudesSchema.plugin(mongologger());

module.exports = mongoose.model('solicitud', SolicitudesSchema)
// var solicitud = mongoose.model('solicitud', SolicitudesSchema);