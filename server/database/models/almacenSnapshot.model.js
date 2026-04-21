const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventarioSnapshotSchema = new Schema({
    // Fecha en la que se realizó el corte (el "momento en el tiempo")
    fechaCorte: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Etiqueta descriptiva (ej: "Inventario Inicial Abril 2026")
    etiqueta: {
        type: String,
        trim: true
    },
    // Array que contiene la copia fiel de los productos en ese momento
    items: [{
        materialId: {
            type: Schema.Types.ObjectId,
            ref: 'material'
        },
        nombreMaterial: String,
        codigo: String,
        lote: String,
        cantidad: String,
        precio: Number,
        pedido: String,

        // --- NUEVOS CAMPOS PARA FICHA TÉCNICA ---
        marca: {
            type: String,
            default: 'S/M'
        },
        gramaje: {
            type: String,
            default: ''
        },
        calibre: {
            type: String,
            default: ''
        },
        ancho: {
            type: String,
            default: ''
        },
        largo: {
            type: String,
            default: ''
        }
        // ----------------------------------------
    }],
    // Resumen estadístico para consultas rápidas sin procesar todo el array
    totales: {
        totalItems: Number,
        valorTotal: Number
    }
}, {
    timestamps: true // Registra createdAt y updatedAt automáticamente
});

// Índice descendente para obtener siempre los cortes más recientes primero
InventarioSnapshotSchema.index({ fechaCorte: -1 });

module.exports = mongoose.model('inventarioSnapshot', InventarioSnapshotSchema);