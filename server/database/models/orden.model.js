const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

var CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 2021000 }
});

var counter = mongoose.model('counter', CounterSchema);

var SolicitudSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1 }
});

var solicitud = mongoose.model('solicitud', SolicitudSchema);


let OrdenSchema = new Schema([{
    estado: {
        type: String,
        default: 'Espera'
    },
    usuario: {
        type: String
    },
    fecha_o: {
        type: Date,
        default: Date.now
    },
    montaje: {
        type: Number
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'cliente'
    },
    producto: {
        materiales: [
            [
                {
                    producto: {
                        type: Schema.Types.ObjectId,
                        ref: 'material'
                    },
                    cantidad: { type: String }
                }
            ]
        ],
        ejemplares: { type: Array },
        grupo: {
            type: Schema.Types.ObjectId,
            ref: 'grupo'
        },
        post: { type: Array },
        cliente: { type: String },
        producto: { type: String },
        cod_cliente: { type: String },
        codigo: { type: String },
        version: { type: String },
        edicion: { type: String },
        montaje: { type: String },
        imagen: { type: String },
    },
    paginas: {
        type: Number,
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    orden: {
        type: String,
        required: true
    },
    demasia: {
        type: Number,
        required: true
    },
    fecha_s: {
        type: Date,
        required: true
    },
    e_c: {
        type: Boolean,
        default: false
    },
    i_ancho: {
        type: Number
    },
    i_largo: {
        type: Number
    },
    sort: {
        type: String
    },
    observacion: {
        type: String,
        default: ''
    },
    solicitud: {
        type: String
    },
    almacen: {
        type: String
    },
    paginas_o: {
        type: String
    },
    cantidad_o: {
        type: String
    }
}], {
    timestamps: true
});

OrdenSchema.plugin(mongologger());

OrdenSchema.pre('save', function (next) {
    var doc = this;
    counter.findByIdAndUpdate({ _id: 'test' }, { $inc: { seq: 1 } }, { new: true, upset: true }).then(function (count) {
        doc.sort = count.seq;
        next();
    })
        .catch(function (error) {
            throw error;
        });
});


// OrdenSchema.pre('save', function(next){
//     var doc = this;
//     solicitud.findByIdAndUpdate({_id: 'test'}, {$inc: {seq: 1}}, {new: true, upset:true}).then(function(count) {
//         doc.solicitud = count.seq;
//         next();
//     })
//     .catch(function(error) {
//         throw error;
//     });
// });

module.exports = mongoose.model('orden', OrdenSchema)
// module.exports = mongoose.model('counter', CounterSchema);
