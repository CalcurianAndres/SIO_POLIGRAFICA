const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let DescuentoSchema = new Schema([{

    fecha:{
        type:Date,
        default:Date.now
    },
    material:{
        type:Schema.Types.ObjectId,
        ref: 'material'
    },
    descuento:{
        type:Number
    },
    razon:{
        type:String
    }

}]);


module.exports = mongoose.model('descuentos', DescuentoSchema)