const {DocumentDefinition, Table, Cell, Txt, Img, Stack} = require('pdfmake-wrapper/server');
const Pdfmake = require('pdfmake');

const { NuevaSolicitud_} = require('../emails/solicitudRepuestos.email')
const moment = require('moment')

const fs = require('fs')

const nodemailer = require('nodemailer');
const { stack } = require('../../routes/repuestos.routes');



async function FAL007(table, nparte, repuesto, categoria, maquina, cantidad, usuario, motivo, seq){

    seq = seq.toString();
    var firstTwoCharacters = seq.slice(0, 2);
    var correlativo = firstTwoCharacters + '-' + seq.slice(2);

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


const hoy = moment().format('DD/MM/yyyy');


doc.pageOrientation('landscape');

path = `\\\\192.168.0.26\\Poligrafica_Archivos\\MANTENIMIENTO\\Inventario\\Asignaciones`
// doc.footer('Si usted esta consultando una versión de este documento, Asegúrese que sea la vigente');

// if(num_solicitud >= 10){
//     num_solicitud = `00${num_solicitud}`
// }
// else if(num_solicitud >= 100){
//     num_solicitud = `0${num_solicitud}`
// }
// else if(num_solicitud < 10){
//   num_solicitud = `000${num_solicitud}`
// }

// if(orden === '#'){
//     orden = "N/A"
// }

doc.add(

    

    new Table([
        [
            new Cell(
                await new Img(__dirname + '/images/poli_cintillo.png', true).width(85).margin([20, 5]).build()
            ).rowSpan(4).end,
            new Cell(new Txt(`
            FORMATO SOLICITUD DE REPUESTOS`).bold().end).alignment('center').fontSize(13).rowSpan(4).end,
            new Cell(new Txt('Código: FAL-007').end).fillColor('#dedede').fontSize(7).alignment('center').end,
        ],
        [
            new Cell(new Txt('').end).end,
            new Cell(new Txt('').end).end,
            new Cell(new Txt('N° de Revisión: 0').end).fillColor('#dedede').fontSize(7).alignment('center').end,
        ],
        [
            new Cell(new Txt('').end).end,
            new Cell(new Txt('').end).end,
            new Cell(new Txt('Fecha de Revisión: 15/01/2024').end).fillColor('#dedede').fontSize(7).alignment('center').end,
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
            new Cell(new Txt('INFORMACIÓN DE LA SOLICITUD').end).bold().color('#FFFFFF').fillColor('#000000').fontSize(10).alignment('center').end
        ],
        [
            new Cell(new Txt(' ').end).fontSize(2).border([false]).end
        ]
    ]).widths(['100%']).end
)

doc.add(
    new Table([
      [
        new Cell(new Txt('FECHA DE SOLICITUD').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`${hoy}`).end).margin([0, 5]).alignment('center').end,
        new Cell(new Txt(``).end).alignment('center').border([false]).end,
        new Cell(new Txt('UNIDAD ADMINISTRATIVA').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt('GERENCIA DE OPERACIONES').end).margin([0, 5]).alignment('center').end,
        new Cell(new Txt(``).end).alignment('center').border([false]).end,
        new Cell(new Txt('N° SOLICITUD').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`RP-SOL-${correlativo}`).end).margin([0,4]).fontSize(15).alignment('center').end,
      ]
    ]).widths(['13%','11%','1%','17%','30%','1%','9%','18%']).end
  )

doc.add(
    '\n'
)

doc.add(
    new Table([
        [
            new Cell(new Txt('INFORMACIÓN DEL MATERIAL').end).bold().color('#FFFFFF').fillColor('#000000').fontSize(10).alignment('center').end
        ],
        [
            new Cell(new Txt(' ').end).fontSize(2).border([false]).end
        ]
    ]).widths(['100%']).end
)

doc.add(
    new Table([
        [
            new Cell(new Txt('Nº DE PARTE').end).margin([0,5]).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('REPUESTO').end).margin([0,5]).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('CATEGORÍA').end).margin([0,5]).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('MÁQUINA').end).margin([0,5]).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('CANTIDAD SOLICITADA (Und)').end).fillColor('#dedede').fontSize(9).alignment('center').end,
        ],
        [
            // new Cell(new Txt('').end).border([false,false]).end,
            // new Cell(new Txt('').end).border([false,false]).end,


            new Cell(new Stack(nparte).end).end,
            new Cell(new Stack(repuesto).end).end,
            new Cell(new Stack(categoria).end).end,
            new Cell(new Stack(maquina).end).end,
            new Cell(new Stack(cantidad).end).end,
            // // new Cell(new Stack(lotes).end).end,
        ]
    ]).widths(['12.5%','37%','12.5%','27.5%','10.5%']).end
)

doc.add(
    '\n'
)

doc.add(
    new Table([
        [
            new Cell(new Txt('MOTIVO').end).bold().fillColor('#000000').color('#FFFFFF').fontSize(9).alignment('center').end,
            new Cell(new Txt(``).end).alignment('center').border([false]).end,
            new Cell(new Txt('SOLICITADO POR:').end).bold().fillColor('#000000').color('#FFFFFF').fontSize(9).alignment('center').end,
            new Cell(new Txt(``).end).alignment('center').border([false]).end,
            new Cell(new Txt('RECIBIDO POR:').end).bold().fillColor('#000000').color('#FFFFFF').fontSize(9).alignment('center').end,
        ],
        [
            new Cell(new Txt(`${motivo}`).end).fontSize(9).end,
            new Cell(new Txt(``).end).alignment('center').border([false]).end,
            new Cell(new Txt(`
            FIRMA: ${usuario}

            FECHA:${hoy}
            `).end).fontSize(9).end,
            new Cell(new Txt(``).end).alignment('center').border([false]).end,
            new Cell(new Txt(`
            FIRMA: YRAIDA BAPTISTA

            FECHA:${hoy}
            `).end).fontSize(9).end,

        ]

    ]).widths(['48%','1%','25%','1%','25%']).end
)

doc.add(
    new Txt('Si usted esta consultando una versión de este documento, Asegúrese que sea la vigente').alignment('right').fontSize(8).end
)




const pdf = printer.createPdfKitDocument(doc.getDefinition());

// pdf.pipe(fs.createWriteStream('document.pdf'));
pdf.end();
// NuevaSolicitud(orden,'calcurianandres@gmail.com',motivo,num_solicitud,pdf)
    NuevaSolicitud_('calcurian.andrew@gmail.com, zuleima.vela@poligraficaindustrial.com, jaime.sanjuan@poligraficaindustrial.com, yraida.baptista@poligraficaindustrial.com, edgar.ramon@poligraficaindustrial.com',pdf,table,motivo,correlativo)
    // NuevaSolicitud_(orden,'calcurianandres@gmail.com',motivo,num_solicitud,pdf,tabla)


// asignacion(orden, solicitud, Lote, pdf,'Equipo', 'calcurian.andrew@gmail.com,enida.aponte@poligraficaindustrial.com,carlos.mejias@poligraficaindustrial.com,freddy.burgos@poligraficaindustrial.com')
//   asignacion(orden, solicitud, Lote, pdf,'EQUIPO DE TRABAJO', 'calcurian.andrew@gmail.com')
//  asignacion(orden, Lote, pdf,'Carlos', 'carlos.mejias@poligraficaindustrial.com')
    //  asignacion(orden, Lote, pdf,'Freddy', 'freddy.burgos@poligraficaindustrial.com')
    return

}

module.exports = {
    FAL007
}