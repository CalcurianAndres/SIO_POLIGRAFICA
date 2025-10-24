const nodemailer = require('nodemailer');
const {header7,header2, footer} = require('../templates/template.email');
let {tituloCorreo} = require('../templates/template.email')

function NuevaSolicitud_(correo,adjunto,table,motivo,correlativo){
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


    let titulo = `<h1>Hola Equipo!</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: correo,
        subject: `Solicitud de repuesto - RP-SOL-${correlativo}`,
        attachments: [{
            filename: `RP-SOL-${correlativo}.pdf`,
            content:adjunto
        }],
        html:`${header7(titulo, 'Nueva Solicitud de Repuesto')}
        <br>
               Se ha realizado una nueva solicitud de repuesto 
               <br>
               <style>
               table, th, td {
               border: 1px solid black;
               border-collapse: collapse;
               }
               </style>
              <table align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                   <tr>
                       <th>Nº de parte</th>
                       <th>Repuesto</th>
                       <th>Categoria</th>
                       <th>Máquina</th>
                       <th>Cantidad</th>
                   </tr>
                   ${table}
               </table><br>
    <b>Motivo:</b>${motivo}<br>
    Dirígete al sistema SIO para asignarlo(s).

            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
           console.log(err);
        }else{
            //// //console.log(info);
        }
    });
}

module.exports = {
    NuevaSolicitud_
}