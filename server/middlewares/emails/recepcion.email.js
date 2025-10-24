const nodemailer = require('nodemailer');
const {header__, footer} = require('../templates/template.email')


function Nueva_recepcion(){
    
    // //// //console.log(lotes, 'lotes')

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

    let titulo = `<h1>Hola NOMBRE</h1>`
    let encabezado = 'Nueva recepción de material'
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.poligrafica@gmail.com>',
        // to: "calcurian.andrew@gmail.com",
        to: "calcurianandres@gmail.com",
        subject: `Nueva recepción de material`,
        html:`${header__(encabezado,titulo)}
        <br>
               Se encuentra disponible para verificación el siguiente material asociado a la factura/Nota de entrega N° 0000
               <style>
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
                <table align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                    <tr>
                    <th>Material</th>
                    <th>Lotes</th>
                    <th>Cantidad</th>
                    </tr>
                    <tr>
                    <td>Amarillo (marca)</td>
                    <td>00001</td>
                    <td>30Kg</td>
                    <tr>
                </table>
               Dirígete al sistema SIO para su verificación
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
            console.log(err);
        }else{
            // //console.log(info);
            // //console.log('ENVIO CORREO DE VERIFICACIÓN DE MATERIAL')
        }
    });
}

function Nueva_recepcion2(){
    
    // //// //console.log(lotes, 'lotes')

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

    let titulo = `<h1>Hola NOMBRE</h1>`
    let encabezado = 'Nueva recepción de material'
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.poligrafica@gmail.com>',
        // to: "calcurian.andrew@gmail.com",
        to: "zuleima.vela@poligraficaindustrial.com",
        subject: `Recepcion de material`,
        html:`${header__(encabezado,titulo)}
        <br>
               Se encuentra disponible para verificación el siguiente material asociado a la factura/Nota de entrega N° 0000
               <style>
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
                <table align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                    <tr>
                    <th>Material</th>
                    <th>Lotes</th>
                    <th>Cantidad</th>
                    </tr>
                    <tr>
                    <td>Amarillo (marca)</td>
                    <td>00001</td>
                    <td>30Kg</td>
                    <tr>
                </table>
               Dirígete al sistema SIO para su verificación
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info)=>{
        if(err){
           console.log(err);
        }else{
            // //console.log(info);
            // //console.log('ENVIO CORREO DE VERIFICACIÓN DE MATERIAL')
        }
    });
}

module.exports = {
    Nueva_recepcion,
    Nueva_recepcion2
}


