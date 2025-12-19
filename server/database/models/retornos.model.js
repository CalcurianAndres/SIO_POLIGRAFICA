const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

const retornosSchema = new Schema({
  origen: {
    type: String,
    required: true
  },
  numero: {
    type: String,
  },
  estatus: {
    type: String,
    default: 'Por confirmar'
  },
  material: {
    nombre: { type: String },
    marca: { type: String },
    ancho: { type: String },
    largo: { type: String },
    calibre: { type: String },
    gramaje: { type: String },
  },
  cantidad: {
    type: Number
  },
  observacion: {
    type: String
  },
  solicitado: {
    type: String,
    required: true
  },
  borrado: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

retornosSchema.plugin(mongologger());

module.exports = mongoose.model('retornos', retornosSchema);
