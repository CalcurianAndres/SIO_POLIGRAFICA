const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

const trasladoSchema = new Schema({
  destino: {
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
  materiales: [
    {
      material: {
        type: Schema.Types.ObjectId,
        ref: 'material'
      },
      codigo: {
        type: String,
        required: true
      },
      lote: {
        type: String,
        required: true
      },
      cantidad: {
        type: String,
        required: true
      },
      pedido: {
        type: String,
      },
      precio: {
        type: Number
      },
      fecha: {
        type: Date,
        default: Date.now
      },
      almacen: {
        type: String
      },
      observacion: {
        type: String
      }
    }
  ],
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

// // Middleware para generar el número con formato YY### automáticamente
// trasladoSchema.pre('save', async function (next) {
//   const doc = this;
//   if (doc.isNew && !doc.numero) {
//     const yearPrefix = new Date().getFullYear().toString().slice(2); // '25' para 2025

//     // Buscar el último documento de ese año
//     const lastDoc = await mongoose.model('traslados').findOne({
//       numero: { $regex: `^${yearPrefix}` }
//     }).sort({ numero: -1 });

//     let counter = 1;
//     if (lastDoc) {
//       const lastNumber = parseInt(lastDoc.numero.slice(2)); // extraer los últimos 3 dígitos
//       counter = lastNumber + 1;
//     }

//     doc.numero = `${yearPrefix}${String(counter).padStart(3, '0')}`; // '25001', '25002', etc.
//   }

//   next();
// });



trasladoSchema.plugin(mongologger());

module.exports = mongoose.model('traslados', trasladoSchema);
