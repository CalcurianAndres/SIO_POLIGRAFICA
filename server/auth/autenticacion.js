const jwt = require('jsonwebtoken');

let verificarToken = ( req, res, next ) =>{

    let token = req.get('Authorization');

    jwt.verify( token, 'Angel&Mirelis', (err, decoded)=>{

        if( err ){
            return res.status(401).json({
                ok:false,
                err: {
                    message: 'token no valido'
                }
            });
        }

        req.usuario = decoded.usuario;
        next();

    });

};

let verificarToken2 = ( req, res, next ) =>{

    let token_two = req.get('Authorization');

    jwt.verify( token_two, 'Angel&Mirelis', (err, decoded)=>{

        if( err ){
            return res.status(401).json({
                ok:false,
                err: {
                    message: 'token no valido'
                }
            });
        }

        req.usuario = decoded.usuario;
        next();

    });

};

let verificar_Role = (req, res, next)=>{
    let usuario = req.usuario;

    if(usuario.Role == 'ADMIN_ROLE'){
        next();
    }else{
        res.status(401).json({
            ok:false,
                err: {
                    message: 'El usuario no es administrador'
                }
        })
    }

}

let verificarTokenImg = (req, res, next)=>{
    let token = req.query.token;

    jwt.verify( token, 'Angel&Mirelis', (err, decoded)=>{

        if( err ){
            return res.status(401).json({
                ok:false,
                err: {
                    message: 'token no valido'
                }
            });
        }

        req.usuario = decoded.usuario;
        next();

    });

}

module.exports = {
    verificarToken,
    verificar_Role,
    verificarToken2,
    verificarTokenImg
};