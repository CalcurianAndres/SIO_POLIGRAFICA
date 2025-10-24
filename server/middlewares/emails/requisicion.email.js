const nodemailer = require('nodemailer');
const {header2, footer} = require('../templates/template.email');
let {tituloCorreo} = require('../templates/template.email')

function NuevaRequisicion_(orden,correo,motivo,name){
    var transporter = nodemailer.createTransport({
        host: "mail.poligraficaindustrial.com",
        port: 2525,
        secure: false,
        auth: {
            user: 'sio.soporte@poligraficaindustrial.com',
            pass: 'P0l1ndc@'
        },
        tls: {
            rejectUnauthorized: false
        },
        maxConnections: 5,
        maxMessages: 10,
        rateDelta: 1000, // 1000 ms delay between sending emails
        rateLimit: true
    });


    let titulo = `<h1>Hola ${name}!</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Solicitud de Material`,
        html:`${header2(titulo)}
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

    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
            console.log(err);
        }else{
            // //console.log(info);
        }
    });


}

function NuevaRequisicion(orden,correo,motivo){
    var transporter = nodemailer.createTransport({
        host: "mail.poligraficaindustrial.com",
        port: 2525,
        secure: false,
        auth: {
            user: 'sio.soporte@poligraficaindustrial.com',
            pass: 'P0l1ndc@'
        },
        tls: {
            rejectUnauthorized: false
        },
        maxConnections: 5,
        maxMessages: 10,
        rateDelta: 1000, // 1000 ms delay between sending emails
        rateLimit: true
    });


    let titulo = `<h1>Hola Jaime!</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Solicitud de Material`,
        html:`${header2(titulo)}
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

    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
            console.log(err);
        }else{
            // //console.log(info);
        }
    });


}



module.exports = {
    NuevaRequisicion,
    NuevaRequisicion_
}
