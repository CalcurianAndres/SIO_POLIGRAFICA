
// Importa las dependencias necesarias
const express = require('express'); // Framework para crear rutas y servidores HTTP
const jwt = require('jsonwebtoken'); // Para generar y verificar tokens JWT
const bcrypt = require('bcrypt'); // Para encriptar y comparar contraseñas y PINs
const Usuario = require('../database/models/usuarios.model'); // Modelo de usuario de la base de datos
const { verificarToken, verificarToken2 } = require('../auth/autenticacion'); // Middlewares para verificar tokens


// Crea una instancia de la aplicación Express
const app = express();


// Ruta para renovar el token JWT (válido por 2 días)
app.get('/api/renew', verificarToken, (req, res) => {
    // Genera un nuevo token con los datos del usuario autenticado
    let token = jwt.sign({
        usuario: req.usuario
    }, 'Angel&Mirelis', { expiresIn: '2d' });

    // Devuelve el nuevo token y los datos del usuario
    res.json({
        ok: true,
        usuario: req.usuario,
        token,
    });
})


// Ruta para renovar el token JWT (válido por 120 segundos) usando otro middleware
app.get('/api/renew2', verificarToken2, (req, res) => {
    // Genera un nuevo token de corta duración
    let token_two = jwt.sign({
        usuario: req.usuario
    }, 'Angel&Mirelis', { expiresIn: 120 });

    // Devuelve el nuevo token y los datos del usuario
    res.json({
        ok: true,
        usuario: req.usuario,
        token_two,
    });
})


// Ruta para validar el PIN en un proceso de autenticación en dos pasos
app.post('/api/validation2steps', (req, res) => {
    let body = req.body;

    // Busca el usuario por correo electrónico
    Usuario.findOne({ Correo: body.correo }, (err, usuarioDB) => {
        if (err) {
            // Error de servidor o base de datos
            return res.status(500).json({
                ok: false,
                err
            });
        }

        // Verifica si el PIN proporcionado coincide con el almacenado (encriptado)
        if (!bcrypt.compareSync(body.pin, usuarioDB.pin)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'PIN INVALIDO'
                }
            });
        }

        // Si el PIN es correcto, genera un token de corta duración
        let token_two = jwt.sign({
            pin: usuarioDB.pin
        }, 'Angel&Mirelis', { expiresIn: 120 });

        // Devuelve el usuario y el token
        res.json({
            ok: true,
            usuario: usuarioDB,
            token_two
        });
    })
})


// Ruta para crear o actualizar el PIN de un usuario
app.post('/api/crear-pin', (req, res) => {
    let body = req.body
    // Encripta el PIN antes de guardarlo
    body.pin = bcrypt.hashSync(body.pin, 10)

    // Actualiza el PIN del usuario en la base de datos
    Usuario.findOneAndUpdate({ Correo: body.correo }, { pin: body.pin }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // Devuelve el usuario actualizado
        res.json({
            ok: true,
            usuario: usuarioDB
        });
    })
})


// Ruta para iniciar sesión (login) de usuario
app.post('/api/login', (req, res) => {
    let body = req.body;

    // Busca el usuario por correo electrónico
    Usuario.findOne({ Correo: body.Correo }, (err, usuarioDB) => {
        if (err) {
            // Error de servidor o base de datos
            return res.status(500).json({
                ok: false,
                err
            });
        }

        // Muestra en consola el nombre del usuario que intenta conectarse
        // console.log('Se conectó: ', usuarioDB.Nombre, ' ', usuarioDB.Apellido)

        // Si no existe el usuario
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o contraseña incorrectos'
                }
            });
        }

        // Verifica si la contraseña es correcta
        if (!bcrypt.compareSync(body.Password, usuarioDB.Password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o contraseña incorrectos'
                }
            });
        }

        // Si todo es correcto, genera un token JWT válido por 2 días
        let token = jwt.sign({
            usuario: usuarioDB
        }, 'Angel&Mirelis', { expiresIn: '2d' });

        // Devuelve el usuario y el token
        res.json({
            ok: true,
            usuario: usuarioDB,
            token
        });
    });
});


// Exporta la aplicación para ser utilizada en otros archivos
module.exports = app;