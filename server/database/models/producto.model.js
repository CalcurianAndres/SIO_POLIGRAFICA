const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let ProductoFinal = new Schema([{
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'cliente'
    },
    img: {
        type: String
    },
    grupo: {
        type: Schema.Types.ObjectId,
        ref: 'grupo'
    },
    producto: {
        type: String
    },
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
    ejemplares: {
        type: Array
    },
    post: {
        type: Array
    },
    cod_cliente: {
        type: String
    },
    codigo: {
        type: String
    },
    version: {
        type: String
    },
    edicion: {
        type: String
    },
    montajes: {
        type: Number
    },
    tamano_desplegado: {
        type: Array
    },
    tamano_cerrado: {
        type: Array
    },
    diseno_producto: {
        type: Array
    },
    diseno_montaje: {
        type: Array
    },
    tamano_sustrato: {
        type: Array
    },
    tamano_pinza: {
        type: Array
    },
    tipo_cuchilla: {
        type: String
    },
    tipo_troquel: {
        type: Array
    },
    direccion_fibra: {
        type: Array
    },
    presion_troquel: {
        type: String
    },
    hendidura_canal: {
        type: String
    },
    Solucion_nota: {
        type: String
    },
    Cantidad_paquete: {
        type: String
    },
    Area_impresion: {
        type: Array
    },
    paletizado: {
        type: String,
        default: 'no-img.png'
    },
    distribucion: {
        type: String,
        default: 'no-img.png'
    },
    aereo: {
        type: String,
        default: 'no-img.png'
    },
    hendidura: {
        type: String,
    },
    impresora_aprobada: {
        type: Array
    },
    troqueladora_aprobada: {
        type: Array
    },
    guillotina_aprobada: {
        type: Array
    },
    pegadora_aprobada: {
        type: Array
    },
    orden_de_color: {
        type: Array
    },
    defectos: {
        type: Array
    }, tipo_paleta: {
        type: Array
    }, firmas: {
        type: Array
    }
}], {
    timestamps: true
});

ProductoFinal.plugin(mongologger());


module.exports = mongoose.model('producto', ProductoFinal)