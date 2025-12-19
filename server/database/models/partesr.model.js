const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');
let Schema = mongoose.Schema;


let SolicitudParteSchema = new Schema({
  orden: { type: String, default: 'test' },
  status: { type: String, default: 'espera' },
  asignacion: { type: Number, default: '0000' },
  motivo: { type: String },
  usuario: { type: String },
  repuestos: [{
    repuesto: {
      type: Schema.Types.ObjectId,
      ref: 'Repuesto'
    },
    cantidad: { type: Number }
  }]
}, {
  timestamps: true
});

SolicitudParteSchema.plugin(mongologger());

module.exports = mongoose.model('RepuestoSolicitud', SolicitudParteSchema);