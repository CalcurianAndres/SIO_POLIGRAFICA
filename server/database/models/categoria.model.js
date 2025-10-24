const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let CategoriaSchema = new Schema([{
    nombre:{
        type:String
    }
}]);

module.exports = mongoose.model('categoria', CategoriaSchema)