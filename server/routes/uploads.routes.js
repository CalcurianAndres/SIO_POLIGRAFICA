const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const Producto = require('../database/models/producto.model');
const atinta = require('../database/models/analisis.tinta.model');
const fabricante = require('../database/models/fabricante.model');
const proveedor = require('../database/models/proveedores.model');
const { compileFunction } = require('vm');

const nodemailer = require('nodemailer');


const app = express();
app.use(fileUpload());


const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: 'sio.soporte@poligraficaindustrial.com',
        pass: 'LkBUe2Drk%pe16YL'
    }
});

app.get('/test-correos', async (req, res) => {
    try {

        // 1️⃣ Verificar conexión SMTP
        await transporter.verify();

        // 2️⃣ Enviar correo de prueba
        const info = await transporter.sendMail({
            from: `"Prueba SMTP" <sio.soporte@poligraficaindustrial.com>`,
            to: 'calcurianandres@gmail.com, zuleima.vela@poligraficaindustrial.com, jaime.sanjuan@poligraficaindustrial.com',
            subject: '✅ Correo de prueba – Office 365',
            text: 'Si estás leyendo esto, el SMTP de Office 365 funciona correctamente.',
            html: `
                <h2>✅ Prueba exitosa</h2>
                <p>El envío de correos con <b>Office 365</b> funciona correctamente.</p>
                <p><small>${new Date().toLocaleString()}</small></p>
            `
        });

        // 3️⃣ Feedback completo
        return res.status(200).json({
            ok: true,
            message: 'Correo enviado correctamente',
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            message: 'Error enviando correo',
            error: error.message,
            code: error.code,
            command: error.command
        });
    }
});

app.put('/api/upload/:tipo/:id', (req, res) => {

    let tipo = req.params.tipo;
    let id = req.params.id;

    if (!req.files) {
        return res.status(400)
            .json({
                ok: false,
                err: {
                    message: 'No se ah seleccionado ningun archivo'
                }
            });
    }

    //validad tipo
    let tipoValido = ['errors', 'usuarios', 'producto', 'despacho', 'distribucion', 'aereo', 'analisis', 'fabricante', 'proveedor', 'repuestos'];
    if (tipoValido.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Error de url'
            }
        })
    }


    let archivo = req.files.archivo;
    let NombreSep = archivo.name.split('.');
    let extension = NombreSep[NombreSep.length - 1];

    let extensionesValidas = ['png', 'jpg', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Extension de archivo no valido'
            }
        })
    }

    //cambiar nombre de la imagen
    let nombreArchivo = `${id}-${new Date().toLocaleDateString('es-ES').replace(/\//g, '_')}_${new Date().toLocaleTimeString('es-ES').replace(/:/g, '')}.${extension}`;

    archivo.mv(`server/uploads/${tipo}/${nombreArchivo}`, (err) => {
        if (err) {
            return res.status(500)
                .json({
                    ok: false,
                    err
                });
        }

        if (tipo === 'producto') {
            ImagenProducto(id, res, nombreArchivo);
        } else if (tipo === 'despacho') {
            ImagenDespacho(id, res, nombreArchivo);
        } else if (tipo === 'distribucion') {
            ImagenDistribucion(id, res, nombreArchivo);
        } else if (tipo === 'aereo') {
            ImagenAereo(id, res, nombreArchivo);
        } else if (tipo === 'analisis') {
            AnalisisTintas(id, res, nombreArchivo);
        } else if (tipo === 'fabricante') {
            Fabricante(id, res, nombreArchivo)
        } else if (tipo === 'proveedor') {
            proveedor_(id, res, nombreArchivo)
        } else if (tipo === 'repuestos') {
            repuesto(id, res, nombreArchivo)
        }

    });

});

function repuesto(id, res, nombreArchivo) {
    //console.log(nombreArchivo)
    res.json({ ok: true, img: nombreArchivo })
}

function proveedor_(id, res, nombreArchivo) {
    proveedor.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'proveedor')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, 'proveedor')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'proveedor'
                }
            });
        }

        borrarArchivo(usuarioDB.logo, 'proveedor')

        usuarioDB.logo = nombreArchivo;

        usuarioDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: usuarioDB,
                logo: nombreArchivo
            })


        });

    });
}

function Fabricante(id, res, nombreArchivo) {
    fabricante.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'fabricante')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, 'fabricante')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Fabricante'
                }
            });
        }

        borrarArchivo(usuarioDB.logo, 'fabricante')

        usuarioDB.logo = nombreArchivo;

        usuarioDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: usuarioDB,
                logo: nombreArchivo
            })


        });

    });
}

function AnalisisTintas(id, res, nombreArchivo) {
    atinta.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'analisis')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, 'analisis')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'usuario no existe___'
                }
            });
        }

        borrarArchivo(usuarioDB.img, 'analisis')

        usuarioDB.img = nombreArchivo;

        usuarioDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: usuarioDB,
                img: nombreArchivo
            })


        });

    });
}

function ImagenAereo(id, res, nombreArchivo) {

    Producto.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'aereo')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, 'aereo')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'usuario no existe'
                }
            });
        }

        borrarArchivo(usuarioDB.aereo, 'aereo')

        usuarioDB.aereo = nombreArchivo;

        usuarioDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: usuarioDB,
                img: nombreArchivo
            })


        });

    });

}

function ImagenDistribucion(id, res, nombreArchivo) {

    Producto.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'distribucion')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, 'distribucion')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'usuario no existe'
                }
            });
        }

        borrarArchivo(usuarioDB.distribucion, 'distribucion')

        usuarioDB.distribucion = nombreArchivo;

        usuarioDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: usuarioDB,
                img: nombreArchivo
            })


        });

    });

}

function ImagenDespacho(id, res, nombreArchivo) {

    Producto.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'despacho')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, 'despacho')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'usuario no existe'
                }
            });
        }

        borrarArchivo(usuarioDB.paletizado, 'despacho')

        usuarioDB.paletizado = nombreArchivo;

        usuarioDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: usuarioDB,
                img: nombreArchivo
            })


        });

    });

}


function ImagenProducto(id, res, nombreArchivo) {

    Producto.findById(id, (err, productoDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, 'producto')
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            borrarArchivo(nombreArchivo, 'producto')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'usuario no existe'
                }
            });
        }

        borrarArchivo(productoDB.img, 'producto')

        productoDB.img = nombreArchivo;

        productoDB.save((err, imageUpdated) => {

            res.json({
                ok: true,
                usuario: productoDB,
                img: nombreArchivo
            })


        });

    });

}

function borrarArchivo(nombreArchivo, tipo) {
    let pathImage = path.resolve(__dirname, `../uploads/${tipo}/${nombreArchivo}`);

    if (fs.existsSync(pathImage)) {
        fs.unlinkSync(pathImage)
    }
}

module.exports = app;