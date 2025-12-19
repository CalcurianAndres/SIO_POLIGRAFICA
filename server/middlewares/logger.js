const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');
const chalk = require('chalk');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { v4: uuidv4 } = require('uuid');

/* ===============================
   CONFIG
=================================*/
const LOG_PATH = path.join(__dirname, '../logs');
const IGNORE_ROUTES = ['/socket', '/favicon', '/health', '/metrics'];

fs.ensureDirSync(LOG_PATH);
fs.ensureDirSync(path.join(LOG_PATH, 'access'));
fs.ensureDirSync(path.join(LOG_PATH, 'errors'));
fs.ensureDirSync(path.join(LOG_PATH, 'security'));

/* ===============================
   HELPERS
=================================*/

function obtenerUsuarioDesdeToken(req) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) return null;

        let token = authHeader;

        if (authHeader.includes(' ')) {
            token = authHeader.split(' ')[1];
        }

        const decoded = jwt.verify(token, 'Angel&Mirelis');

        return {
            id: decoded._id || null,
            usuario: `${decoded.usuario.Nombre} ${decoded.usuario.Apellido}`,
            rol: decoded.usuario.Departamento || 'SIN DEPARTAMENTO'
        };

    } catch (error) {
        return null;
    }
}

function colorMetodo(method) {
    const map = {
        GET: chalk.green,
        POST: chalk.blue,
        PUT: chalk.yellow,
        PATCH: chalk.magenta,
        DELETE: chalk.red
    };
    return (map[method] || chalk.white)(method);
}

function colorStatus(code) {
    if (code >= 500) return chalk.bgRed.white(code);
    if (code >= 400) return chalk.red(code);
    if (code >= 300) return chalk.yellow(code);
    return chalk.green(code);
}

function getCountry(ip) {
    if (!ip) return 'N/A';
    const geo = geoip.lookup(ip.replace('::ffff:', ''));
    return geo ? geo.country : 'LOCAL';
}

function writeFile(type, data) {
    const date = new Date().toISOString().slice(0, 10);
    const file = path.join(LOG_PATH, type, `${date}.log`);
    fs.appendFileSync(file, JSON.stringify(data) + '\n');
}

/* ===============================
   MAIN MIDDLEWARE
=================================*/
function loggerPro(req, res, next) {

    if (IGNORE_ROUTES.some(r => req.originalUrl.includes(r))) {
        return next();
    }

    const id = uuidv4();
    const start = Date.now();

    req.correlationId = id;

    const ip =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.ip ||
        'N/A';

    const parser = new UAParser(req.headers['user-agent']);
    const userAgent = parser.getResult();

    const usuarioData = obtenerUsuarioDesdeToken(req);

    res.on('finish', () => {

        const duration = Date.now() - start;
        const fecha = new Date().toLocaleString('es-ES');
        const country = getCountry(ip);
        const status = res.statusCode;

        const logObject = {
            id,
            fecha: new Date().toISOString(),
            metodo: req.method,
            ruta: req.originalUrl,
            status,
            duracion_ms: duration,
            ip,
            pais: country,
            usuario: usuarioData?.usuario || 'INVITADO',
            rol: usuarioData?.rol || 'N/A',
            navegador: userAgent.browser.name || 'N/A',
            so: userAgent.os.name || 'N/A'
        };

        /* ========== CONSOLA ========== */

        console.log(
            chalk.gray(`[${fecha}]`),
            colorMetodo(req.method),
            chalk.cyan(req.originalUrl),
            '|',
            usuarioData ? chalk.white(usuarioData.usuario) : chalk.yellow('INVITADO'),
            '|',
            usuarioData ? chalk.magenta(usuarioData.rol) : chalk.gray('N/A'),
            '|',
            chalk.gray(ip),
            chalk.blue(country),
            '|',
            colorStatus(status),
            chalk.gray(`${duration}ms`),
            chalk.gray(`#${id.slice(0, 8)}`)
        );

        /* ========== ARCHIVOS ========== */

        if (status >= 500) {
            logObject.body = req.body;
            logObject.tipo = "ERROR";
            writeFile('errors', logObject);

        } else if (status === 401 || status === 403) {
            logObject.tipo = "SECURITY";
            writeFile('security', logObject);

        } else {
            logObject.tipo = "ACCESS";
            writeFile('access', logObject);
        }

    });

    next();
}

module.exports = loggerPro;
