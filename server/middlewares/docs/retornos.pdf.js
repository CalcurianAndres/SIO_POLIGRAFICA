const {DocumentDefinition, Table, Cell, Txt, Img, Stack} = require('pdfmake-wrapper/server');
const Pdfmake = require('pdfmake');

const {NuevaSolicitud, NuevaSolicitud_} = require('../emails/solicitud.email')
const moment = require('moment')

const fs = require('fs')

const nodemailer = require('nodemailer');
const path = require('path');
const {NuevoTraslado} = require('../emails/traslados.email');
const { NuevoRetorno } = require('../emails/retornos.email')


const Retornos = async(data) =>{

    const printer = new Pdfmake({
        Roboto: {
            normal: __dirname + '/fonts/Roboto/Roboto-Regular.ttf',
            bold: __dirname + '/fonts/Roboto/Roboto-Medium.ttf',
            italics: __dirname + '/fonts/Roboto/Roboto-Italic.ttf',
            bolditalics: __dirname + '/fonts/Roboto/Roboto-MediumItalic.ttf'
        }
    });

    const fecha = moment(data.fecha).format('DD/MM/YYYY')

    const pdf = new DocumentDefinition();

    pdf.pageOrientation('portrait');

    pdf.add(
      new Table([
        [
          new Cell(await new Img(__dirname + '/images/poli_cintillo.png', true).width(85).margin([30, 5]).build()).rowSpan(4).end,
          new Cell(new Txt(`
          NOTA DE TRASLADO 
          DE MATERIALES - POLIGRÁFICA`).bold().end).alignment('center').fontSize(13).rowSpan(4).end,
          new Cell(new Txt('Código: FAL-008').end).fillColor('#dedede').fontSize(8).alignment('center').end,
        ],
        [
          new Cell(new Txt('').end).end,
          new Cell(new Txt('').end).end,
          new Cell(new Txt('N° de Revisión: 0').end).fillColor('#dedede').fontSize(8).alignment('center').end,
        ],
        [
          new Cell(new Txt('').end).end,
          new Cell(new Txt('').end).end,
          new Cell(new Txt('Fecha de Revision: 05/09/2025').end).fillColor('#dedede').fontSize(8).alignment('center').end,
        ],
        [
          new Cell(new Txt('').end).end,
          new Cell(new Txt('').end).end,
          new Cell(new Txt('Página: 1 de 1').end).fillColor('#dedede').fontSize(8).alignment('center').end,
        ],
      ]).widths(['25%','50%','25%']).end
    )

    pdf.add(

     '\n'

    )

    pdf.add(
      new  Table([
        [
          new Cell(new Txt('Destino').end).fillColor('#dedede').fontSize(10).end,
          new Cell(new Txt('Nº').end).fillColor('#dedede').fontSize(10).end
        ],
        [
          new Cell(new Txt('Poligráfica Industrial C.A.').end).margin([0,5,0,0]).fontSize(10).end,
          new Cell(new Txt(`AL-NTP-${data.numero}`).bold().end).fontSize(20).end
        ]
      ]).widths(['70%','30%']).end
    )

    pdf.add(
     '\n'
    )

    pdf.add(
      new  Table([
        [
          new Cell(new Txt('Material').end).fillColor('#dedede').fontSize(7).end,
          new Cell(new Txt('Marca').end).fillColor('#dedede').fontSize(7).end,
          new Cell(new Txt('Ancho (cm)').end).fillColor('#dedede').fontSize(7).end,
          new Cell(new Txt('Largo (cm)').end).fillColor('#dedede').fontSize(7).end,
          new Cell(new Txt('Calibre (pt)').end).fillColor('#dedede').fontSize(7).end,
          new Cell(new Txt('Gramaje (g/m²)').end).fillColor('#dedede').fontSize(7).end,
          new Cell(new Txt('Cantidad (Hojas)').end).fillColor('#dedede').fontSize(7).end,
        ],
        [
         new Cell(new Txt(data.material.nombre).end).fontSize(8).end,
         new Cell(new Txt(data.material.marca).end).fontSize(8).end,
         new Cell(new Txt(data.material.ancho).end).fontSize(8).end,
         new Cell(new Txt(data.material.largo).end).fontSize(8).end,
         new Cell(new Txt(data.material.calibre).end).fontSize(8).end,
         new Cell(new Txt(data.material.gramaje).end).fontSize(8).end,
         new Cell(new Txt(data.cantidad).end).fontSize(8).end,
        ],
      ]).widths(['30%','10%','10%','10%','10%','12%','18%']).end
    )

    pdf.add(
     '\n'
    )

    pdf.add(
      new  Table([
        [
          new Cell(new Txt('Observación:').end).fillColor('#dedede').fontSize(10).end,
        ],
        [
          new Cell(new Txt(data.observacion).end).height(5).fontSize(10).end,
        ],
      ]).widths(['100%']).end
    )

    pdf.add(
     '\n'
    )

    pdf.add(
      new  Table([
        [
          new Cell(new Txt('Solicitado por:').end).fillColor('#dedede').fontSize(10).end,
          new Cell(new Txt('Entregado por:').end).fillColor('#dedede').fontSize(10).end,
          new Cell(new Txt('Recibido por:').end).fillColor('#dedede').fontSize(10).end
        ],
        [
          new Cell(new Txt(`Firma: ${data.solicitado}
          
          Fecha: ${fecha}`).end).fontSize(10).end,
          new Cell(new Txt(`Firma:
          
          Fecha:`).end).fontSize(10).end,
          new Cell(new Txt(`Firma:
          
          Fecha:`).end).fontSize(10).end
        ],
      ]).widths(['30%','30%','30%']).end
    )


const doc = printer.createPdfKitDocument(pdf.getDefinition());
const currentYear = new Date().getFullYear();
const currentDateTime = new Date();
const day = currentDateTime.getDate();
const month = currentDateTime.getMonth() + 1; // Months are zero-based, so we add 1
const year = currentDateTime.getFullYear();
const hour = currentDateTime.getHours();
const minute = currentDateTime.getMinutes();
const second = currentDateTime.getSeconds();
const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const formattedDateTime = `${day}_${month}_${year}_${hour}_${minute}_${second}`;
const directoryPath = `\\\\192.168.0.26\\Poligrafica_Archivos\\LOGISTICA\\Almacen\\Traslados\\${currentYear}`;
// const directoryPath = `\\\\192.168.0.23\\Formatos\\${currentYear}`;
let pdfPath = '';
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`Directory ${directoryPath} created.`);
}

const traslado = doc;
traslado.pipe(fs.createWriteStream(`${directoryPath}\\AL-NTP-${data.numero}_${formattedDateTime}.pdf`));
pdfPath = `${directoryPath}\\AL-NTP-${data.numero}_${formattedDateTime}.pdf`


doc.end();
const pdfStream = fs.createReadStream(pdfPath);

NuevoRetorno(data, pdfStream)

}

module.exports = {
    Retornos
}