const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let AlmacenadoSchema = new Schema([{

    material:{
        type:Schema.Types.ObjectId,
        ref: 'material'
    },
    codigo:{
        type:String
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
    almacen:{
        type:String
    },
    observacion:{
        type:String
    }

}]);


module.exports = mongoose.model('almacenadoExterno', AlmacenadoSchema)