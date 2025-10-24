const {DocumentDefinition, Table, Cell, Txt, Img, Stack} = require('pdfmake-wrapper/server');
const Pdfmake = require('pdfmake');

const {asignacion, asignacion_,asignacion___} = require('../emails/asignacion.email')
const moment = require('moment')

const fs = require('fs')

const nodemailer = require('nodemailer');

async function FAL005(orden,solicitud, Lote, materiales, lotes, cantidades,Requi){

// //console.log(cantidades, 'ok')


const printer = new Pdfmake({
    Roboto: {
        normal: __dirname + '/fonts/Roboto/Roboto-Regular.ttf',
        bold: __dirname + '/fonts/Roboto/Roboto-Medium.ttf',
        italics: __dirname + '/fonts/Roboto/Roboto-Italic.ttf',
        bolditalics: __dirname + '/fonts/Roboto/Roboto-MediumItalic.ttf'
    }
});

/**
 * By default, Pdfmake uses 'Roboto' fonts, if you want 
 * to use custom fonts, you need to use the useFont method 
 * like this:
 * 
 * DocumentDefinition.useFont('MyCustomFonts');
 */

const doc = new DocumentDefinition();

if(orden === "#"){
    orden = 'N/A'
}
const hoy = moment().format('DD/MM/yyyy');


doc.pageOrientation('landscape');
// doc.footer('Si usted esta consultando una versión de este documento, Asegúrese que sea la vigente');

if(solicitud >= 10){
    solicitud = `00${solicitud}`
}
else if(solicitud >= 100){
    solicitud = `0${solicitud}`
}
else if(solicitud < 10){
  solicitud = `000${solicitud}`
}

doc.add(

    

    new Table([
        [
            new Cell(
                await new Img(__dirname + '/images/poli_cintillo.png', true).width(85).margin([20, 5]).build()
            ).rowSpan(4).end,
            new Cell(new Txt(`
            FORMATO DE ASIGNACIÓN DE MATERIAL`).bold().end).alignment('center').fontSize(13).rowSpan(4).end,
            new Cell(new Txt('Código: FAL-005').end).fillColor('#dedede').fontSize(7).alignment('center').end,
        ],
        [
            new Cell(new Txt('').end).end,
            new Cell(new Txt('').end).end,
            new Cell(new Txt('N° de Revisión: 0').end).fillColor('#dedede').fontSize(7).alignment('center').end,
        ],
        [
            new Cell(new Txt('').end).end,
            new Cell(new Txt('').end).end,
            new Cell(new Txt('Fecha de Revisión: 11/10/2022').end).fillColor('#dedede').fontSize(7).alignment('center').end,
        ],
        [
            new Cell(new Txt('').end).end,
            new Cell(new Txt('').end).end,
            new Cell(new Txt('Página: 1 de 1').end).fillColor('#dedede').fontSize(7).alignment('center').end,
        ]
    ]).widths(['25%','50%','25%']).end
);

doc.add(
    '\n'
)

doc.add(
    new Table([
      [
        new Cell(new Txt('FECHA DE ASIGNACIÓN').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`${hoy}`).end).end,
        new Cell(new Txt('N° ASIGNACIÓN').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`AL-ASG-${solicitud}`).end).fontSize(15).alignment('center').end,
      ],
      [
        new Cell(new Txt('UNIDAD ADMINISTRATIVA').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt('GERENCIA DE OPERACIONES').end).end,
        new Cell(new Txt('ORDEN DE PRODUCCIÓN').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`${orden}`).end).alignment('center').end,
      ]
    ]).widths(['25%','25%','25%','25%']).end
  )

doc.add(
    '\n'
)

doc.add(
    new Table([
        [
            new Cell(new Txt('DESCRIPCIÓN DEL MATERIAL').end).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('N° DE LOTE').end).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('CANTIDAD ASIGNADA').end).fillColor('#dedede').fontSize(9).alignment('center').end,
        ],
        [
            new Cell(new Stack(materiales).end).end,
            new Cell(new Stack(lotes).end).end,
            new Cell(new Stack(cantidades).end).end
        ]
    ]).widths(['50%','15%','35%']).end
)

doc.add(
    '\n'
)

doc.add(
    new Table([
        [
            new Cell(new Txt('').end).border([false,false]).end,
            new Cell(new Txt('ASIGNADO POR:').end).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('RECIBIDO POR:').end).fillColor('#dedede').fontSize(9).alignment('center').end,
        ],
        [
            new Cell(new Txt().end).border([false,false]).end,
            new Cell(new Txt(`
            FIRMA: YRAIDA BAPTISTA

            FECHA:${hoy}
            `).end).fontSize(9).end,
            new Cell(new Txt(`
            FIRMA: ENIDA APONTE

            FECHA:${hoy}
            `).end).fontSize(9).end,

        ]

    ]).widths(['50%','25%','25%']).end
)

doc.add(
    new Txt('Si usted esta consultando una versión de este documento, Asegúrese que sea la vigente').alignment('right').fontSize(8).end
)




const pdf = printer.createPdfKitDocument(doc.getDefinition());
pdf.end();

    asignacion___(orden, solicitud, Lote, pdf,'Equipo', 'calcurianandres@gmail.com,zuleima.vela@poligraficaindustrial.com')

    //  if(Requi){
    //     // asignacion_(orden, solicitud, Lote, pdf,'Equipo', 'calcurianandres@gmail.com')
    //     asignacion_(orden, solicitud, Lote, pdf,'Equipo', 'calcurianandres@gmail.com,luis.malave@poligraficaindustrial.com,raul.diaz@poligraficaindustrial.com,enida.aponte@poligraficaindustrial.com,zuleima.vela@poligraficaindustrial.com,carlos.mejias@poligraficaindustrial.com,freddy.burgos@poligraficaindustrial.com,yraida.baptista@poligraficaindustrial.com')
    //  }else{
    //     asignacion(orden, solicitud, Lote, pdf,'Equipo', 'calcurianandres@gmail.com,luis.malave@poligraficaindustrial.com,raul.diaz@poligraficaindustrial.com,enida.aponte@poligraficaindustrial.com,zuleima.vela@poligraficaindustrial.com,carlos.mejias@poligraficaindustrial.com,freddy.burgos@poligraficaindustrial.com,yraida.baptista@poligraficaindustrial.com')
      
    //     // asignacion(orden, solicitud, Lote, pdf,'Equipo', 'calcurianandres@gmail.com')
    //  }
//    asignacion(orden, solicitud, Lote, pdf,'Equipo', 'calcurianandres@gmail.com')
//  asignacion(orden, Lote, pdf,'Carlos', 'carlos.mejias@poligraficaindustrial.com')
    //  asignacion(orden, Lote, pdf,'Freddy', 'freddy.burgos@poligraficaindustrial.com')
    return

}

module.exports = {
    FAL005
}