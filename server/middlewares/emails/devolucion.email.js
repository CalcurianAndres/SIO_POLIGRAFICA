const nodemailer = require('nodemailer');
const {header, header3, footer} = require('../templates/template.email')

function devolucion(orden, solicitud,adjunto,nombre,correo,tabla){

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


    let titulo = `<h1>Hola ${nombre},</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Devolución de Material`,
        attachments: [{
            filename: `AL-DEV-${solicitud}_${orden}.pdf`,
            content:adjunto
        }],
        html:`${header3(titulo)}
        <br>
               Se ha realizado la devolución de material relacionado con la orden de producción:
               <br>
               <h1 align="center">Nº ${orden}</h1>
               <br>
               <style>
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
            <table align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
            <tr>
                <th>Material</th>
                <th>Cantidad</th>
            </tr>
            ${tabla}
            </table><br>
                Es necesario verificar el material y aceptar en el sistema SIO
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
            console.log(err);
        }else{
            return
        }
    });
}

function devolucion2(orden, solicitud,nombre,correo,tabla){

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


    let titulo = `<h1>Hola ${nombre},</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Devolución de Material`,
        html:`${header3(titulo)}
        <br>
               Se ha realizado la devolución de material relacionado con la orden de producción:
               <br>
               <h1 align="center">Nº ${orden}</h1>
               <br>
               <style>
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
<table align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                   <tr>
                       <th>Material</th>
                       <th>Cantidad</th>
                   </tr>
                   ${tabla}
               </table><br>
                El mismo deberia estar siendo gestionado por Yraida
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
            console.log(err);
        }else{
            return
        }
    });
}

module.exports = {
    devolucion,
    devolucion2
}