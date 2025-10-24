require('./config/.env');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')



//server
const app = express();

//Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())

app.use(express.static(__dirname + '/public'));


//rutas
app.use(require('./routes/index.routes'));
app.use('**', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
});

//Base de datos
require('./database/connection');

//correr app
app.listen(8080, () => {
    console.log('Escuchando Puerto:', 8080)
});