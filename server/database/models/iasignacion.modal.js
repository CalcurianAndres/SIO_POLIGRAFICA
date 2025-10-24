const mongoose = require('mongoose');

let Schema = mongoose.Schema;

var IasignacionSchema = new mongoose.Schema({
    _id: {type: String, required:true},
    seq: {type: Number, default: 2021000}
});

module.exports = mongoose.model('iasignacion', IasignacionSchema)

