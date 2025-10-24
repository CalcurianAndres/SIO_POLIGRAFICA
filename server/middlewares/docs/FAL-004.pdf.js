const {DocumentDefinition, Table, Cell, Txt, Img, Stack} = require('pdfmake-wrapper/server');
const Pdfmake = require('pdfmake');

const {NuevaSolicitud, NuevaSolicitud_} = require('../emails/solicitud.email')
const moment = require('moment')

const fs = require('fs')

const nodemailer = require('nodemailer');
const path = require('path');



async function FAL004(producto_,orden, num_solicitud,producto,cantidad,usuario, motivo,tabla,correo){

if(orden === "#"){
    orden = "N/A"
}

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
// doc.footer('Si usted esta consultando una versión de este documento, Asegúrese que sea la vigente');

if(num_solicitud >= 10){
    num_solicitud = `00${num_solicitud}`
}
else if(num_solicitud >= 100){
    num_solicitud = `0${num_solicitud}`
}
else if(num_solicitud < 10){
  num_solicitud = `000${num_solicitud}`
}

if(orden === '#'){
    orden = "N/A"
}

doc.add(

    

    new Table([
        [
            new Cell(
                await new Img(__dirname + '/images/poli_cintillo.png', true).width(85).margin([20, 5]).build()
            ).rowSpan(4).end,
            new Cell(new Txt(`
            FORMATO SOLICITUD DE MATERIAL`).bold().end).alignment('center').fontSize(13).rowSpan(4).end,
            new Cell(new Txt('Código: FAL-004').end).fillColor('#dedede').fontSize(7).alignment('center').end,
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
        new Cell(new Txt('FECHA DE SOLICITUD').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`${hoy}`).end).end,
        new Cell(new Txt('N° SOLICITUD').end).fillColor('#dedede').fontSize(10).alignment('center').end,
        new Cell(new Txt(`AL-SOL-${num_solicitud}`).end).fontSize(15).alignment('center').end,
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
            // new Cell(new Txt('N° DE LOTE').end).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('CANTIDAD SOLICITADA').end).fillColor('#dedede').fontSize(9).alignment('center').end,
        ],
        [
            // new Cell(new Txt('').end).border([false,false]).end,
            // new Cell(new Txt('').end).border([false,false]).end,


            new Cell(new Stack(producto).end).end,
            new Cell(new Stack(cantidad).end).end
            // // new Cell(new Stack(lotes).end).end,
        ]
    ]).widths(['75%','25%']).end
)

doc.add(
    '\n'
)

doc.add(
    new Table([
        [
            new Cell(new Txt('MOTIVO').end).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('SOLICITADO POR:').end).fillColor('#dedede').fontSize(9).alignment('center').end,
            new Cell(new Txt('RECIBIDO POR:').end).fillColor('#dedede').fontSize(9).alignment('center').end,
        ],
        [
            new Cell(new Txt(`${motivo}`).end).fontSize(9).end,
            new Cell(new Txt(`
            ${usuario}

            FECHA:${hoy}
            `).end).fontSize(9).end,
            new Cell(new Txt(`
            FIRMA: YRAIDA BAPTISTA

            FECHA:${hoy}
            `).end).fontSize(9).end,

        ]

    ]).widths(['50%','25%','25%']).end
)

doc.add(
    new Txt('Si usted esta consultando una versión de este documento, Asegúrese que sea la vigente').alignment('right').fontSize(8).end
)




const pdf = printer.createPdfKitDocument(doc.getDefinition());
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
const directoryPath = `\\\\192.168.0.26\\Poligrafica_Archivos\\DEPARTAMENTO DE PRODUCCION\\ÓRDENES DE PRODUCCIÓN\\${currentYear}`;
// const directoryPath = `\\\\192.168.0.27\\Formatos\\${currentYear}`;
let pdfPath = '';
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`Directory ${directoryPath} created.`);
}
if(orden === 'N/A'){
    orden = 'N_A'
    const almacenado_ = pdf;
    path_path = `${directoryPath}\\Solicitudes adicionales\\${day} de ${meses[month-1]}\\Solicitudes`
    if(!fs.existsSync(path_path)){
        fs.mkdirSync(path_path, { recursive: true });
        almacenado_.pipe(fs.createWriteStream(`${path_path}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`));
        pdfPath = `${path_path}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`
    }else{
        almacenado_.pipe(fs.createWriteStream(`${path_path}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`));
        pdfPath = `${path_path}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`
    }
}else{
    if (fs.existsSync(directoryPath)) {
        const files = fs.readdirSync(directoryPath);
        const matchingFolder = files.find(file => fs.statSync(path.join(directoryPath, file)).isDirectory() && file.startsWith(orden));
    
        if (matchingFolder) {
            const almacenado = pdf;
            almacenado.pipe(fs.createWriteStream(`${directoryPath}\\${matchingFolder}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`));
            pdfPath = `${directoryPath}\\${matchingFolder}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`
            console.log(`Found folder starting with order number ${orden}: ${matchingFolder}`);
        } else {
            let path_new = `${directoryPath}\\${orden} ${producto_}`;
            if (!fs.existsSync(path_new)) {
                fs.mkdirSync(path_new, { recursive: true });
                console.log(`Directory ${path_new} created.`);
                const almacenado_ = pdf;
                almacenado_.pipe(fs.createWriteStream(`${path_new}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`));
                pdfPath = `${path_new}\\AL-SOL-${num_solicitud}_${orden}_${formattedDateTime}.pdf`
            }
            console.log(`No folder found starting with order number ${orden} in the directory.`);
        }
    } else {
        console.log(`Directory ${directoryPath} does not exist.`);
    }
}
pdf.end();
const pdfStream = fs.createReadStream(pdfPath);
// NuevaSolicitud(orden,'calcurianandres@gmail.com',motivo,num_solicitud,pdf)
if(orden === 'N/A'){
    NuevaSolicitud_(orden,`yraida.baptista@poligraficaindustrial.com,zuleima.vela@poligraficaindustrial.com,jaime.sanjuan@poligraficaindustrial.com,${correo}`,motivo,num_solicitud,pdfStream,tabla)
    // NuevaSolicitud_(orden,'calcurianandres@gmail.com',motivo,num_solicitud,pdf,tabla)
    // console.log('this one')
}else{
    NuevaSolicitud(orden,`yraida.baptista@poligraficaindustrial.com,zuleima.vela@poligraficaindustrial.com,jaime.sanjuan@poligraficaindustrial.com,${correo}`,motivo,num_solicitud,pdfStream,tabla)
    // NuevaSolicitud(orden,'enida.aponte@poligraficaindustrial.com,carlos.mejias@poligraficaindustrial.com,freddy.burgos@poligraficaindustrial.com,zuleima.vela@poligraficaindustrial.com,yraida.baptista@poligraficaindustrial.com,calcurianandres@gmail.com',motivo,num_solicitud,pdf,tabla)
    // NuevaSolicitud_(orden,'calcurianandres@gmail.com',motivo,num_solicitud,pdf,tabla)
    // NuevaSolicitud(orden,'calcurianandres@gmail.com',motivo,num_solicitud,pdf,tabla)
    // console.log('this other')
}


// asignacion(orden, solicitud, Lote, pdf,'Equipo', 'calcurian.andrew@gmail.com,enida.aponte@poligraficaindustrial.com,carlos.mejias@poligraficaindustrial.com,freddy.burgos@poligraficaindustrial.com')
//   asignacion(orden, solicitud, Lote, pdf,'EQUIPO DE TRABAJO', 'calcurian.andrew@gmail.com')
//  asignacion(orden, Lote, pdf,'Carlos', 'carlos.mejias@poligraficaindustrial.com')
//  asignacion(orden, Lote, pdf,'Freddy', 'freddy.burgos@poligraficaindustrial.com')
    return

}

module.exports = {
    FAL004
}