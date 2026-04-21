const nodemailer = require('nodemailer');
const { header2, footer } = require('../templates/template.email');
let { tituloCorreo } = require('../templates/template.email')

function NuevaRequisicion_(orden, correo, motivo, name) {
    var transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false, // SIEMPRE false con STARTTLS
        auth: {
            user: 'sio.soporte@poligraficaindustrial.com',
            pass: 'LkBUe2Drk%pe16YL'
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });


    let titulo = `<h1>Hola ${name}!</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Solicitud de Material`,
        html: `${header2(titulo)}
        <br>
               Se ha realizado una nueva solicitud de material
               <br>

               <style>
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
    <b>Motivo:</b>${motivo}<br>
    Dirígete al sistema SIO para ver detalles y aceptar o rechazar esta solicitud.

            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            // //console.log(info);
        }
    });


}

function NuevaRequisicion(orden, correo, motivo) {
    var transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false, // SIEMPRE false con STARTTLS
        auth: {
            user: 'sio.soporte@poligraficaindustrial.com',
            pass: 'LkBUe2Drk%pe16YL'
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });


    let titulo = `<h1>Hola Jaime!</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Solicitud de Material`,
        html: `${header2(titulo)}
        <br>
               Se ha realizado una nueva solicitud de material asociada a la Orden de Producción:
               <br>
               <h1 align="center">Nº ${orden}</h1>
               <br>
               <style>
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
    <b>Motivo:</b>${motivo}<br>
    Dirígete al sistema SIO para ver detalles y aceptar o rechazar esta solicitud.

            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            // //console.log(info);
        }
    });


}



module.exports = {
    NuevaRequisicion,
    NuevaRequisicion_
}
