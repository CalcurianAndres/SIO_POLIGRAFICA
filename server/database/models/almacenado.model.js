const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let AlmacenadoSchema = new Schema([{

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
    fuera:{
        type:Boolean,
        default:false
    }

}]);


module.exports = mongoose.model('almacenado', AlmacenadoSchema)