require('./config/.env');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const http = require('http');
const { Server } = require('socket.io');

const chokidar = require('chokidar');
const loggerPro = require('./middlewares/logger');

// =============================
// ✅ Crear servidor Express
// =============================
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());
app.use(express.static(__dirname + '/public'));

// =============================
// ✅ Crear SERVER y Socket.IO
// =============================
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

module.exports.io = io;
// // =============================
// // ✅ WATCHER /public (live reload)
// // =============================
// const watcher = chokidar.watch(path.join(__dirname, 'public'), {
//     ignoreInitial: true,
//     persistent: true
// });

// watcher.on('all', (event, filePath) => {
//     io.emit('reload');
// });

// =============================
// ✅ Base de datos
// =============================
require('./database/connection');

// =============================
// ✅ Crear carpeta /logs
// =============================
app.use(loggerPro);

// =============================
// ✅ SOCKET.IO
// =============================
io.on('connection', (socket) => {

});

// =============================
// ✅ Rutas (NO se modifican)
// =============================
app.use(require('./routes/index.routes'));

// =============================
// ✅ Fallback Angular/SPA
// =============================
app.use('**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================
// ✅ Iniciar servidor
// =============================
const PORT = 8080;

server.listen(PORT, () => {
    console.log(`
✅ Servidor corriendo correctamente
📡 Puerto: ${PORT}
📁 Logs: /logs
    `);
});
