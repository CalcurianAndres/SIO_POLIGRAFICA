const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let IngresosNSchema = new Schema([{

    fecha:{
        type:Date,
        default:Date.now
    },
    material:{
        type:Schema.Types.ObjectId,
        ref: 'material'
    }

}]);


module.exports = mongoose.model('ingresosNew', IngresosNSchema)