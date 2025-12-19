const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');
let Schema = mongoose.Schema;

const RepuestoSchema = new mongoose.Schema({
  maquina: {
    type: Schema.Types.ObjectId,
    ref: 'maquina',
  },
  categoria: {
    type: Schema.Types.ObjectId,
    ref: 'categoria',
  },
  nombre: { type: String },
  parte: { type: String },
  foto: { type: String },
}, {
  timestamps: true
});

RepuestoSchema.plugin(mongologger());

module.exports = mongoose.model('Repuesto', RepuestoSchema);