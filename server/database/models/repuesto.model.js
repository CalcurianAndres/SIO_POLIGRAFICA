const mongoose = require('mongoose');
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
});

module.exports = mongoose.model('Repuesto', RepuestoSchema);