const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');
let Schema = mongoose.Schema;

var ConversionCountSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 21000 }
});

var convCount = mongoose.model('convCount', ConversionCountSchema);

let ConversionSchema = new Schema([{

    bobina: {
        type: String
    },
    peso: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    descuentos: {
        type: Number,
        default: 0
    },
    sort: {
        type: String
    },
    fecha: {
        type: Date,
        default: Date.now
    }

}], {
    timestamps: true
});

ConversionSchema.pre('save', function (next) {
    var doc = this;
    convCount.findByIdAndUpdate({ _id: 'test' }, { $inc: { seq: 1 } }, { new: true, upset: true }).then(function (count) {
        doc.sort = count.seq;
        next();
    })
        .catch(function (error) {
            throw error;
        });
});

ConversionSchema.plugin(mongologger());

// module.exports = mongoose.model('convCount', ConversionCountSchema)
module.exports = mongoose.model('conversion', ConversionSchema);
