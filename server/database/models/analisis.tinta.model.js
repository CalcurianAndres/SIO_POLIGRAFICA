const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let AtintaSchema = new Schema([{

    producto:{type:String},
    marcar:{type:String},
    presentacion:{type:String},
    f_fabricacion:{type:String},
    f_vencimiento:{type:String},
    estandar:{type:String},
    DrawDown:{type:Array},
    tipo:{type:Array},
    lote:{type:String},
    img:{type:String},
    guardado:{type:String},
    dia:{type:String},
    sobre:{type:String},
    prueba_:{type:String},
    total:{type:String},
    carton:[
      // 1
      [
        {
        lab_estandar:{type:Array}, 
        lab_muestra:{type:Array}
        },
      ],
      // 2
      [
        {
        lab_estandar:{type:Array}, 
        lab_muestra:{type:Array}
        },
      ],
      // 3
      [
        {
        lab_estandar:{type:Array}, 
        lab_muestra:{type:Array}
        },
      ]
    ],
    papel:[
      // 1
      [
        {
        lab_estandar:{type:Array}, 
        lab_muestra:{type:Array}
        },
      ],
      // 2
      [
        {
        lab_estandar:{type:Array}, 
        lab_muestra:{type:Array}
        },
      ],
      // 3
      [
        {
        lab_estandar:{type:Array}, 
        lab_muestra:{type:Array}
        },
      ]
    ],
    prueba:[
      [{lab:{type:Array}}],
      [{lab:{type:Array}}],
      [{lab:{type:Array}}]
    ],
    observaciones:{type:String}
    
}])

module.exports = mongoose.model('atinta', AtintaSchema)