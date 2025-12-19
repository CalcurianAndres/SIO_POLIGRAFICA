const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let SustratoSchema = new Schema([{

    cantidad: {
        type: String,
        required: true
    },
    material: {
        type: String,
        required: true
    }

}], {
    timestamps: true
});

SustratoSchema.plugin(mongologger());


module.exports = mongoose.model('sustrato', SustratoSchema)