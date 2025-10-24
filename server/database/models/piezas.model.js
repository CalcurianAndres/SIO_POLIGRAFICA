const mongoose = require('mongoose');
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
  nota: {type: String}
});

module.exports = mongoose.model('Pieza', piezaSchema);