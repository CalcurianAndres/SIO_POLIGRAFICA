const mongoose = require('mongoose');
const mongologger = require('../../middlewares/mongologger');

let Schema = mongoose.Schema;

let NotificacionesSchema = new Schema([{
    notificacion: [
        {
            fecha: {
                type: Date,
                default: Date.now
            },
            usuario: {
                type: Schema.Types.ObjectId,
                ref: 'usuario'
            },
            tipo: {
                type: String,
                required: true
            },
            mensaje: {
                type: String,
                required: true
            }
        }

    ]
}], {
    timestamps: true
});

NotificacionesSchema.plugin(mongologger());


module.exports = mongoose.model('notificacion', NotificacionesSchema)