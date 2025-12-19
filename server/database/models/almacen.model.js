const mongoose = require('mongoose');
const mongoLogger = require('../../middlewares/mongologger');


let Schema = mongoose.Schema;

let AlmacenSchema = new Schema([{

    material:{
        type:Schema.Types.ObjectId,
        ref: 'material'
    },
    codigo:{
        type:String,
        required:true
    },
    lote:{
        type:String,
        required:true
    },
    cantidad:{
        type:String,
        required:true
    },
    pedido:{
        type:String,
    },
    precio:{
        type:Number
    },
    fecha:{
        type:Date,
        default:Date.now
    },
    estado:{
        type:String,
        default:'Pendiente'
    },
    proveedor:{
        type:Schema.Types.ObjectId,
        ref: 'proveedor'
    },
    proveedor:{
        type:Schema.Types.ObjectId,
        ref: 'fabricante'
    }

}]);


module.exports = mongoose.model('almacen', AlmacenSchema)