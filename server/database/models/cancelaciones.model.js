const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let CancelacionSchema = new Schema([{
    orden:{
        type:Schema.Types.ObjectId,
        ref: 'orden'
    },
    Motivo:{
        type:String,
        required:true
    }
}]);

module.exports = mongoose.model('cancelacion', CancelacionSchema)