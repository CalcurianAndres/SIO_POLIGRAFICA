const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');
let Schema = mongoose.Schema;

const piezaSchema = new mongoose.Schema({
  maquina: {
    type: Schema.Types.ObjectId,
    ref: 'maquina',
  },
  categoria: {
    type: Schema.Types.ObjectId,
    ref: 'categoria',
  },
  repuesto: {
    type: Schema.Types.ObjectId,
    ref: 'Repuesto',
  },
  fecha: { type: Date },
  proveedor: { type: String },
  factura: { type: String },
  precio: { type: Number },
  ubicacion: { type: String },
  cantidad: { type: Number },
  nota: { type: String }
}, {
  timestamps: true
});

piezaSchema.plugin(mongologger());

module.exports = mongoose.model('Pieza', piezaSchema);