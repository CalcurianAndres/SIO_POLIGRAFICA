const mongoose = require('mongoose');

let Schema = mongoose.Schema;

var ISolicitudSchema = new mongoose.Schema({
    _id: {type: String, required:true},
    seq: {type: Number, default: 2021000}
});

module.exports = mongoose.model('isolicitud', ISolicitudSchema)