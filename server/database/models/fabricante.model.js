const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let FabricanteSchema = new Schema([{
    nombre:{
        type:String,
        required:true
    },
    alias:{
        type:String,
        required:true
    },
    origenes:{
        type:Array,
    },
    grupo:{
        type:Array,
    },
    logo:{
        type:String,
        default:'no-image'
    },

}])

module.exports = mongoose.model('fabricante', FabricanteSchema)