const nodemailer = require('nodemailer');
const { header7, footer } = require('../templates/template.email')
const usuario = require('../../database/models/usuarios.model');
// const usuariosModel = require('../../database/models/usuarios.model');

const NuevoRetorno = async (data, adjunto) => {

    table = `<tr>
        <td>${data.material.nombre}</td>
        <td>${data.material.marca}</td>
        <td>${data.material.ancho}</td>
        <td>${data.material.largo}</td>
        <td>${data.material.calibre}</td>
        <td>${data.material.gramaje}</td>
        <td>${data.cantidad}</td>
        
    </tr>`

    nombre = data.solicitado.split(' ')[0]
    apellido = data.solicitado.split(' ')[1]

    const usuario_ = await usuario.find({ Nombre: nombre, Apellido: apellido })

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
        subject: `Traslado de material - AL-NTP-${data.numero}`,
        attachments: [{
            filename: `AL-NTP-${data.numero}.pdf`,
            content: adjunto
        }],
        html: `${header7(titulo, 'Nuevo traslado de material')}
        <br>
               Se ha aprobado tu solicitud de traslado de material destino Poligrafica industrial C.A.
               <br>
               <style>
.tabla {
    width: 600px;
    margin: 0 auto;
    border-collapse: collapse;
    background: #ffffff;
    border: 1px solid #cccccc;
  }

  .tabla th {
    background: #f2f2f2; /* gris clarito */
    color: #333333;      /* gris suave */
    text-align: left;
    padding: 10px;
    font-size: 15px;
    border-bottom: 1px solid #cccccc;
  }

  .tabla td {
    padding: 10px;
    font-size: 14px;
    color: #333333;
    border-bottom: 1px solid #e6e6e6;
  }

  .tabla tr:nth-child(even) td {
    background: #fafafa; /* gris suave alternado */
  }

  .tabla tr:last-child td {
    border-bottom: none;
  }
</style>
                <table class = 'tabla' align="center" border=".5" cellpading="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                   <tr>
                       <th>Material</th>
                       <th>Marca</th>
                       <th>Ancho (cm)</th>
                       <th>Largo (cm)</th>
                       <th>Calibre (pt)</th>
                       <th>Gramaje (g/m²)</th>
                       <th>Cantidad (Hojas)</th>
                   </tr>
                   ${table}
               </table><br>
    <b>Motivo:</b>${data.observacion}<br>

            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log(info);
        }
    });
}

module.exports = {
    NuevoRetorno
}