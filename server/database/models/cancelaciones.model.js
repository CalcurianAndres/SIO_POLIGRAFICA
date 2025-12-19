const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let CancelacionSchema = new Schema([{
    orden: {
        type: Schema.Types.ObjectId,
        ref: 'orden'
    },
    Motivo: {
        type: String,
        required: true
    }
}], {
    timestamps: true
});

CancelacionSchema.plugin(mongologger());

module.exports = mongoose.model('cancelacion', CancelacionSchema)