const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let ProveedorSchema = new Schema([{
    nombre:{
        type:String,
        required:true
    },
    direccion:{
        type:String,
    },
    rif:{
        type:String,
    },
    grupo:{

        type:Array,
    },
    contactos:{
        type:Array,
    },
    fabricantes:{
        type:Array,
    },
    logo:{
        type:String,
        default:'no-image'
    }

}])

module.exports = mongoose.model('proveedor', ProveedorSchema)