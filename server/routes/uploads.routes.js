const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const Producto = require('../database/models/producto.model');
const atinta = require('../database/models/analisis.tinta.model');
const fabricante = require('../database/models/fabricante.model');
const proveedor = require('../database/models/proveedores.model');
const { compileFunction } = require('vm');



const app = express();
app.use(fileUpload());

app.put('/api/upload/:tipo/:id', (req, res)=>{

    let tipo = req.params.tipo;
    let id = req.params.id;

    if(!req.files){
        return res.status(400)
                .json({
                    ok:false,
                    err:{
                        message:'No se ah seleccionado ningun archivo'
                    }
        });
    }

    //validad tipo
    let tipoValido = ['errors', 'usuarios','producto','despacho','distribucion','aereo','analisis','fabricante','proveedor','repuestos'];
    if( tipoValido.indexOf( tipo ) < 0 ){
        return res.status( 400 ).json({
            ok:false,
            err:{
                message:'Error de url'
            }
        })
    }


    let archivo = req.files.archivo;
    let NombreSep = archivo.name.split('.');
    let extension = NombreSep[NombreSep.length - 1];

    let extensionesValidas = ['png', 'jpg', 'jpeg'];

    if(extensionesValidas.indexOf( extension ) < 0){
        return res.status( 400 ).json({
            ok:false,
            err:{
                message:'Extension de archivo no valido'
            }
        })
    }

    //cambiar nombre de la imagen
    let nombreArchivo = `${id}-${new Date().toLocaleDateString('es-ES').replace(/\//g, '_')}_${new Date().toLocaleTimeString('es-ES').replace(/:/g, '')}.${extension}`;

    archivo.mv(`server/uploads/${tipo}/${nombreArchivo}`, (err)=>{
        if(err){
            return res.status(500)
                        .json({
                            ok:false,
                            err
            });
        }

        if(tipo === 'producto'){
            ImagenProducto(id, res, nombreArchivo);
        }else if(tipo === 'despacho'){
            ImagenDespacho(id, res, nombreArchivo);
        }else if(tipo === 'distribucion'){
            ImagenDistribucion(id, res, nombreArchivo);
        }else if(tipo === 'aereo'){
            ImagenAereo(id, res, nombreArchivo);
        }else if(tipo === 'analisis'){
            AnalisisTintas(id, res, nombreArchivo);
        }else if(tipo === 'fabricante'){
            Fabricante(id, res, nombreArchivo)
        }else if(tipo === 'proveedor'){
            proveedor_(id, res, nombreArchivo)
        }else if(tipo === 'repuestos'){
            repuesto(id, res, nombreArchivo)
        }

    });

});

function repuesto(id, res, nombreArchivo){
    //console.log(nombreArchivo)
    res.json({ok:true, img:nombreArchivo})
}

function proveedor_(id, res, nombreArchivo){
    proveedor.findById(id,(err,usuarioDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'proveedor')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!usuarioDB){
            borrarArchivo(nombreArchivo, 'proveedor')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'proveedor'
                }
            });
        }
        
        borrarArchivo(usuarioDB.logo, 'proveedor')

        usuarioDB.logo = nombreArchivo;

        usuarioDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:usuarioDB,
                logo:nombreArchivo
            })


        });

    });
}

function Fabricante(id, res, nombreArchivo){
    fabricante.findById(id,(err,usuarioDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'fabricante')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!usuarioDB){
            borrarArchivo(nombreArchivo, 'fabricante')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'Fabricante'
                }
            });
        }
        
        borrarArchivo(usuarioDB.logo, 'fabricante')

        usuarioDB.logo = nombreArchivo;

        usuarioDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:usuarioDB,
                logo:nombreArchivo
            })


        });

    });
}

function AnalisisTintas(id, res, nombreArchivo){
    atinta.findById(id,(err,usuarioDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'analisis')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!usuarioDB){
            borrarArchivo(nombreArchivo, 'analisis')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'usuario no existe___'
                }
            });
        }
        
        borrarArchivo(usuarioDB.img, 'analisis')

        usuarioDB.img = nombreArchivo;

        usuarioDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:usuarioDB,
                img:nombreArchivo
            })


        });

    });
}

function ImagenAereo(id, res,nombreArchivo){

    Producto.findById(id,(err,usuarioDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'aereo')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!usuarioDB){
            borrarArchivo(nombreArchivo, 'aereo')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'usuario no existe'
                }
            });
        }
        
        borrarArchivo(usuarioDB.aereo, 'aereo')

        usuarioDB.aereo = nombreArchivo;

        usuarioDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:usuarioDB,
                img:nombreArchivo
            })


        });

    });

}

function ImagenDistribucion(id, res,nombreArchivo){

    Producto.findById(id,(err,usuarioDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'distribucion')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!usuarioDB){
            borrarArchivo(nombreArchivo, 'distribucion')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'usuario no existe'
                }
            });
        }
        
        borrarArchivo(usuarioDB.distribucion, 'distribucion')

        usuarioDB.distribucion = nombreArchivo;

        usuarioDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:usuarioDB,
                img:nombreArchivo
            })


        });

    });

}

function ImagenDespacho(id, res,nombreArchivo){

    Producto.findById(id,(err,usuarioDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'despacho')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!usuarioDB){
            borrarArchivo(nombreArchivo, 'despacho')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'usuario no existe'
                }
            });
        }
        
        borrarArchivo(usuarioDB.paletizado, 'despacho')

        usuarioDB.paletizado = nombreArchivo;

        usuarioDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:usuarioDB,
                img:nombreArchivo
            })


        });

    });

}


function ImagenProducto(id, res,nombreArchivo){

    Producto.findById(id,(err,productoDB)=>{
        if( err ){
            borrarArchivo(nombreArchivo, 'producto')
            return res.status(500).json({
                ok:false,
                err
            });
        }

        if(!productoDB){
            borrarArchivo(nombreArchivo, 'producto')
            return res.status(400).json({
                ok:false,
                err:{
                    message: 'usuario no existe'
                }
            });
        }
        
        borrarArchivo(productoDB.img, 'producto')

        productoDB.img = nombreArchivo;

        productoDB.save((err, imageUpdated)=>{

            res.json({
                ok:true,
                usuario:productoDB,
                img:nombreArchivo
            })


        });

    });

}

function borrarArchivo(nombreArchivo, tipo){
    let pathImage = path.resolve(__dirname, `../uploads/${ tipo }/${ nombreArchivo }`);

        if( fs.existsSync(pathImage) ){
            fs.unlinkSync(pathImage)
        }
}

module.exports = app;