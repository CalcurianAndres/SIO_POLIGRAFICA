const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let ClienteSchema = new Schema([{

    nombre:{
        type:String,
        required:true
    },
    codigo:{
        type:String,
        required:true
    },
    almacenes:{
        type:Array,
    },
    rif:{
        type:String
    },
    direccion:{
        type:String
    },
    contactos:{
        type:Array
    },
    fecha:{
        type:Date,
        default:Date.now
    }

}]);


module.exports = mongoose.model('cliente', ClienteSchema)