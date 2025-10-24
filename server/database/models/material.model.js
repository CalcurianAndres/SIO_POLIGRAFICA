const mongoose = require('mongoose');
const { defaults } = require('underscore');

let Schema = mongoose.Schema;

let MateriaPrima = new Schema([{
            codigo_profit:{
                type:String,
                
            },
            fecha:{
                type:Date,
                default:Date.now
            },
            grupo:{
                type:Schema.Types.ObjectId,
                ref: 'materia' 
            },
            nombre:{
                type:String
            },
            marca:{
                type:String
            },
            ancho:{
                type:Number
            },
            largo:{
                type:Number
            },
            gramaje:{
                type:Number
            },
            calibre:{
                type:Number
            },
            cantidad:{
                type:Number
            },
            unidad: {
                type:String
            },
            presentacion: {
                type:String
            },
            neto: {
                type:Number
            },
            color:{
                type:String
            },
            cinta:{
                type:Number
            },
            gramaje_e:{
                type:Array,
                defaults:[0,0,0]
            },
            calibre_e:{
                type:Array,
                defaults:[0,0,0]
            },
            cobb:{
                type:Array,
                defaults:[0,0,0]
            },
            curling:{
                type:Array,
                defaults:[0,0,0]
            },
            blancura:{
                type:Array,
                defaults:[0,0,0]
            },
            preparacion:[
                {

                    nombre:{
                        type:String,
                        default:null
                    },
                    id:{
                        type:String,
                        default:null
                    },
                    cantidad:{
                        type:Number,
                        default:null
                    }
                }
            ],
            chemical:{
                type:String
            },
            ph:{
                type:String
            },
            conductividad:{
                type:String
            },
            descripcion:{
                type:String
            },
            tipo:{
                type:String
            },
            ECT:{
                type:String
            },
            teq:{
                type:String
            },
            // codigo: {
            //     type:String
            // },
            // lote:{
            //     type:String
            // },
            eliminado:{
                type:Boolean,
                default:false
            }

}]);


module.exports = mongoose.model('material', MateriaPrima)