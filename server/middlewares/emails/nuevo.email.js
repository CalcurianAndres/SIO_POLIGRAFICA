const nodemailer = require('nodemailer');
const { header, header2, footer } = require('../templates/template.email')


// ENVIAR EMAIL POR CORREO NUEVO

function emailNuevo(titulo, correo, nombre, apellido, any, sede, departamento) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.CORREO,
            pass: process.env.PASS_CORREO
        }
    });
    let tituloCorreo = 'Nuevo ticket creado!'
    const mensaje =
        `${header(tituloCorreo)}
        Se ha generado un nuevo ticket <strong>${titulo}</strong>
        <br>
        Tu solicitud sera atendida lo mas pronto posible, el equipo de soporte técnico
        se pondrá en contacto con usted en cualquier momento.
        ${footer}`;

    var mailOptions = {
        from: '"Soporte Técnico" <thermo.soporte.group@gmail.com>',
        to: correo,
        subject: 'Ticket creado exitosamente',
        html: mensaje
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
            if (departamento != 'profit') {
                nuevoSoporte(titulo, nombre, apellido, any, sede)
            } else {
                nuevoProfit(titulo, nombre, apellido, any, sede)
            }
        } else {
            if (departamento != 'profit') {
                nuevoSoporte(titulo, nombre, apellido, any, sede)
            } else {
                nuevoProfit(titulo, nombre, apellido, any, sede)
            }
        }
    });


}
function NuevaOrden3(orden, lotes, adjunto) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            user: process.env.CORREO,
            pass: process.env.PASS_CORREO
        }
    });
    let titulo = `<h1>Hola Enida,</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.poligrafica@gmail.com>',
        to: "enida.aponte@poligraficaindustrial.com, calcurianandres@gmail.com",
        subject: `Nueva orden de producción`,
        attachments: [{
            filename: 'FAL-005.pdf',
            content: adjunto
        }],
        html: `${header2(titulo)}
        <br>
               Se ha realizado la asignación de material relacionado con la orden de producción:
               <br>
               <h1 align="center">Nº ${orden}</h1>
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
                    <th>Lotes</th>
                    <th>Cantidad</th>
                    </tr>
                    ${lotes}
                </table>
               Ya puedes dirigirte al almacen a retirar
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            //// //console.log(info);
        }
    });
}

function NuevaOrden2(orden, lotes, adjunto) {

    // //// //console.log(lotes, 'lotes')

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            user: process.env.CORREO,
            pass: process.env.PASS_CORREO
        },
        maxConnections: 5,
        maxMessages: 10,
        rateDelta: 1000, // 1000 ms delay between sending emails
        rateLimit: true
    });
    let titulo = `<h1>Hola Carlos,</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.poligrafica@gmail.com>',
        // to: "calcurian.andrew@gmail.com",
        to: "carlos.mejias@poligraficaindustrial.com",
        subject: `Nueva orden de producción`,
        attachments: [{
            filename: 'FAL-005.pdf',
            content: adjunto
        }],
        html: `${header2(titulo)}
        <br>
               Se ha realizado la asignación de material relacionado con la orden de producción:
               <br>
               <h1 align="center">Nº ${orden}</h1>
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
                    <th>Lotes</th>
                    <th>Cantidad</th>
                    </tr>
                    ${lotes}
                </table>
               Ya puedes dirigirte al almacen a retirar
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            // //// //console.log(info);
            //// //console.log('correo enviado')
        }
    });
}

function NuevaOrden(orden, nombre, correo) {
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
        subject: `Nueva orden de producción`,
        html: `${header2(titulo)}
        <br>
               Se ha generado una nueva orden de producción:
               <br>
               <h1 align="center">Nº ${orden}</h1>
               <br>
               para consultarla ingresa al sistema haciendo click <a href='http://192.168.0.23:8080'>Aqui</a>
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            //// //console.log(info);
        }
    });
}

function SolicitudMateria(orden, producto) {
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
    let titulo = `<h1>Hola Yraida,</h1>`
    var mailOptions = {
        from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
        to: "calcurianandres@gmail.com, Yraida.Baptista@poligraficaindustrial.com",
        subject: `Solicitud de Materiales`,
        html: `${header(titulo)}
        <br>
               Se ha generado una solicitud de material relacionado con la orden de produccion:
               <br>
               <h1 align="center">Nº ${orden}</h1>
               <br>
               No olvides ingresar al sistema para asignar material haciendo click <a href='http://192.168.0.23:8080/almacen'>Aqui</a>
            ${footer}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            //// //console.log(info);
        }
    });
}

function nuevoProfit(titulo, nombre, apellido, any, sede) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.CORREO,
            pass: process.env.PASS_CORREO
        }
    });
    let tituloCorreo = 'Nuevo ticket creado!'
    var mailOptions = {
        from: '"Soporte Técnico" <ticket.purissima@gmail.com>',
        to: "ahernandez@purissimagroup.com, ycasares@purissimagroup.com, calcurianandres@gmail.com, jsotin@hotmail.com",
        subject: `Nuevo ticket - ${titulo}`,
        html: `${header(tituloCorreo)}
                Se generó un nuevo ticket por ${nombre} ${apellido}, con el titulo ${titulo}
                <br>
                el AnyDesk del contacto es: <strong>${any}</strong>
            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            //// //console.log(info);
        }
    });
}

function nuevoSoporte(titulo, nombre, apellido, any, sede) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.CORREO,
            pass: process.env.PASS_CORREO
        }
    });
    let tituloCorreo = 'Nuevo ticket creado!'
    var mailOptions = {
        from: '"Soporte Técnico (Purissima)" <ticket.purissima@gmail.com>',
        to: "calcurianandres@gmail.com, jsotin@hotmail.com",
        subject: `Nuevo ticket - ${titulo}`,
        html: `${header(tituloCorreo)}
                Se generó un nuevo ticket por ${nombre} ${apellido} (Purissima), con el titulo '${titulo}'
                <br>
                el AnyDesk del contacto es: <strong>${any}</strong>
            ${footer}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            //// //console.log(info);
        }
    });
}

module.exports = {
    emailNuevo,
    SolicitudMateria,
    NuevaOrden,
    NuevaOrden2,
    NuevaOrden3
}
