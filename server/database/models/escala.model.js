const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let EscalaSchema = new Schema([{

    producto:{
        type:Schema.Types.ObjectId,
        ref: 'producto'
    },
    descripcion:{
        type:String,
        required:true
    },
    montaje:{
        type:Number,
        required:true
    },
    escalas:{
        type:Array,
    },
    cliente:{
        type:Schema.Types.ObjectId,
        ref: 'producto' 
    },
    fecha:{
        type:Date,
        default:Date.now
    }

}]);


module.exports = mongoose.model('escala', EscalaSchema)