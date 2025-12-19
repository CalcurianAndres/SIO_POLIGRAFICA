const express = require('express');
const router = express.Router();
const { io } = require('../server'); // el archivo de tu backend

router.get('/trigger-reload', (req, res) => {
    io.emit('reload');
    res.json({ ok: true, msg: "Recarga enviada" });
});

module.exports = router;