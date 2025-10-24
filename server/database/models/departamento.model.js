const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let DepartamentoSchema = new Schema([{

    fecha:{
        type:Date,
        default:Date.now
    },
    departamento:{
        type:String
    },
    roles:{
        type:Array
    },

}]);


module.exports = mongoose.model('departamento', DepartamentoSchema)