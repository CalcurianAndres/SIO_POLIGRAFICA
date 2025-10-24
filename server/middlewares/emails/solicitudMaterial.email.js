const nodemailer = require('nodemailer');
const { header, footer} = require('../templates/template.email')
const Orden = require('../../database/models/orden.model')
const Requisicion = require('../../database/models/requisicion.model')
const {FAL004} = require('../docs/FAL-004.pdf');
const isolicitud = require('../../database/models/isolicitud.modal')


let pads = 0;

function SolicitarRequisicion(id_requi){
    Requisicion.findOne({_id:id_requi})
        .populate('cliente producto producto.grupo')
        .populate({path: 'producto', populate:{path:'materiales.producto', populate:{path:'grupo'}}})
        .exec((err, orden)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }

            let Producto = []
            let cantidad = []

            for(let i = 0; i<orden.producto.materiales[orden.montaje].length; i++){
                if(orden.producto.materiales[orden.montaje][i].producto.ancho)
                {
                    Producto.push(`${orden.producto.materiales[orden.montaje][i].producto.nombre} ${orden.producto.materiales[orden.montaje][i].producto.marca}, ${orden.producto.materiales[orden.montaje][i].producto.ancho} x ${orden.producto.materiales[orden.montaje][i].producto.largo} - (Cal: ${orden.producto.materiales[orden.montaje][i].producto.calibre}, Gramaje: ${orden.producto.materiales[orden.montaje][i].producto.gramaje}`)
                }else{
                    Producto.push(`${orden.producto.materiales[orden.montaje][i].producto.nombre} (${orden.producto.materiales[orden.montaje][i].producto.marca})`)
                }
                
                if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Tinta'){
                    
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Barniz'){
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Pega'){
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Cajas Corrugadas'){
                    let cantidad_ = Caja_((orden.cantidad / orden.producto.materiales[orden.montaje][i].cantidad), orden.producto.materiales[orden.montaje][i].producto.cinta)
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Cinta de Embalaje'){
                    let cantidad_ = orden.producto.materiales[orden.montaje][i].producto.cinta * (orden.cantidad / orden.producto.materiales[orden.montaje][i].cantidad)
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else {
                    cantidad.push(`${orden.paginas} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }
                
                // <ng-container *ngIf="materiales.producto.grupo.nombre == 'Tinta'">
                //                                 {{((materiales.cantidad * orden.paginas)/1000).toFixed(2)}}{{Unidad(materiales.producto.nombre)}}
                //                             </ng-container>
                //                             <ng-container *ngIf="materiales.producto.grupo.nombre == 'Barniz'">
                //                                 {{((materiales.cantidad * orden.paginas)/1000).toFixed(2)}}{{Unidad(materiales.producto.nombre)}}
                //                             </ng-container>
                //                             <ng-container *ngIf="materiales.producto.grupo.nombre == 'Pega'">
                //                                 {{((materiales.cantidad * orden.cantidad)/1000).toFixed(2)}}{{Unidad(materiales.producto.nombre)}}
                //                             </ng-container>
                //                             <ng-container *ngIf="materiales.producto.grupo.nombre == 'Cajas Corrugadas'">
                //                                 {{Caja_((orden.cantidad / materiales.cantidad),materiales.producto.cinta)}}{{Unidad(materiales.producto.nombre)}}
                                            
                //                             </ng-container>
                //                             <ng-container *ngIf="materiales.producto.grupo.nombre == 'Cinta de Embalaje'">
                //                                 {{cintas_}}{{Unidad(materiales.producto.nombre)}}
                //                             </ng-container>
                
                let final = orden.producto.materiales[orden.montaje].length - 1;
                if(i === final){
    isolicitud.findByIdAndUpdate({_id: 'iterator'}, {$inc: {seq: 1}}, {new: true, upset:true})
                .exec((err, solicitud)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    
                    FAL004(orden.producto.producto,orden.sort,solicitud.seq,Producto,cantidad,'SIO','Nueva orden de produccion')
                })
                } 
            }
        })
}   

function SolicitudMateria(orden_){
    

    Orden.findOne({sort:orden_})
        .populate('cliente producto producto.grupo')
        .populate({path: 'producto', populate:{path:'materiales.producto', populate:{path:'grupo'}}})
        .exec((err, orden)=>{
            if( err ){
                return res.status(400).json({
                    ok:false,
                    err
                });
            }

            let Producto = []
            let cantidad = []

            for(let i = 0; i<orden.producto.materiales[orden.montaje].length; i++){
                if(orden.producto.materiales[orden.montaje][i].producto.ancho)
                {
                    Producto.push(`${orden.producto.materiales[orden.montaje][i].producto.nombre} ${orden.producto.materiales[orden.montaje][i].producto.marca}, ${orden.producto.materiales[orden.montaje][i].producto.ancho} x ${orden.producto.materiales[orden.montaje][i].producto.largo} - (Cal: ${orden.producto.materiales[orden.montaje][i].producto.calibre}, Gramaje: ${orden.producto.materiales[orden.montaje][i].producto.gramaje}`)
                }else{
                    Producto.push(`${orden.producto.materiales[orden.montaje][i].producto.nombre} (${orden.producto.materiales[orden.montaje][i].producto.marca})`)
                }
                
                if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Tinta'){
                    
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Barniz'){
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Pega'){
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Barniz Acuoso'){
                    let cantidad_ = ((orden.producto.materiales[orden.montaje][i].cantidad * orden.paginas)/1000).toFixed(2)
                    
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Cajas Corrugadas'){
                    let cantidad_ = Caja_((orden.cantidad / orden.producto.materiales[orden.montaje][i].cantidad), orden.producto.materiales[orden.montaje][i].producto.cinta)
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Soportes de Embalaje'){
                    let cantidad_ = (orden.producto.materiales[orden.montaje][i].cantidad * this.pads).toFixed(2)
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else if(orden.producto.materiales[orden.montaje][i].producto.grupo.nombre == 'Cinta de Embalaje'){
                    let cantidad_ = orden.producto.materiales[orden.montaje][i].producto.cinta * (orden.cantidad / orden.producto.materiales[orden.montaje][i].cantidad)
                    cantidad.push(`${cantidad_} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }else {
                    cantidad.push(`${orden.paginas} ${orden.producto.materiales[orden.montaje][i].producto.unidad}`)
                }
                
                let final = orden.producto.materiales[orden.montaje].length - 1;
                if(i === final){
    isolicitud.findByIdAndUpdate({_id: 'iterator'}, {$inc: {seq: 1}}, {new: true, upset:true})
                .exec((err, solicitud)=>{
                    if( err ){
                        return res.status(400).json({
                            ok:false,
                            err
                        });
                    }

                    
                    FAL004(orden.producto.producto,orden_,solicitud.seq,Producto,cantidad,'SIO','Nueva orden de produccion')
                })
                } 
            }
        })

    // var transporter = nodemailer.createTransport({
    //     host: "mail.poligraficaindustrial.com",
    //     port: 25,
    //     secure: false,
    //     auth: {
    //         user: 'sio.soporte@poligraficaindustrial.com',
    //         pass: 'P0l1ndc@'
    //     },
    //     tls: {
    //         rejectUnauthorized: false
    //     }
    // });
    // let titulo = `<h1>Hola Yraida,</h1>`
    // var mailOptions = {
    //     from: '"SIO - Sistema Integral de Operacion" <sio.soporte@poligraficaindustrial.com>',
    //     to: "calcurianandres@gmail.com",
    //     // to: "calcurianandres@gmail.com, Yraida.Baptista@poligraficaindustrial.com",
    //     subject: `Solicitud de Materiales`,
    //     html:`${header(titulo)}
    //     <br>
    //            Se ha generado una solicitud de material relacionado con la orden de produccion:
    //            <br>
    //            <h1 align="center">Nº ${orden}</h1>
    //            <br>
    //            No olvides ingresar al sistema para asignar material haciendo click <a href='http://192.168.0.27:8080/almacen'>Aqui</a>
    //         ${footer}`
    // };
    // transporter.sendMail(mailOptions, (err, info)=>{
    //     if(err){
    //         //// //console.log(err);
    //     }else{
    //         //// //console.log(info);
    //     }
    // });
}

function Caja_(caja, cinta){
    caja = Math.ceil(caja);
    this.pads = caja;
    this.cintas_= Number(cinta * caja)
    return caja
  }

module.exports = {
    SolicitudMateria,
    SolicitarRequisicion
}