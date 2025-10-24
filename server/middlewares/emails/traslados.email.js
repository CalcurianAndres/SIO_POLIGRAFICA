const nodemailer = require('nodemailer');
const { header7, footer} = require('../templates/template.email')
const usuario  = require('../../database/models/usuarios.model');
// const usuariosModel = require('../../database/models/usuarios.model');

const NuevoTraslado = async(data, adjunto) =>{


    table = `<tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>`

    nombre = data.solicitado.split(' ')[0]
    apellido = data.solicitado.split(' ')[1]

    const usuario_ = await usuario.find({Nombre:nombre, Apellido:apellido})

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


    let titulo = `<h1>Hola ${data.solicitado}!</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: usuario_[0].Correo,
        subject: `Traslado de material - AL-NT-${data.numero}`,
        attachments: [{
            filename: `AL-NT-${data.numero}.pdf`,
            content:adjunto
        }],
        html:`${header7(titulo, 'Nueva Solicitud de traslado de material')}
        <br>
               Se ha aprobado tu solicitud de traslado de material destino ${data.destino}
               <br>
               <style>
               table, th, td {
               border: 1px solid black;
               border-collapse: collapse;
               }
               </style>
              <table align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                   <tr>
                       <th>Producto</th>
                       <th>codigo</th>
                       <th>lote</th>
                       <th>cantidad</th>
                   </tr>
                   ${table}
               </table><br>
    <b>Motivo:</b>${data.observacion}<br>

            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
           console.log(err);
        }else{
            console.log(info);
        }
    });
}

module.exports = {
    NuevoTraslado
}