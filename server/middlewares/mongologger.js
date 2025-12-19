const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/* ===============================
   CONFIG
=================================*/

const LOG_PATH = path.join(__dirname, '../logs/mongo');
fs.ensureDirSync(LOG_PATH);

/* ===============================
   HELPERS
=================================*/

function writeMongoLog(data) {
    const date = new Date().toISOString().slice(0, 10);
    const file = path.join(LOG_PATH, `${date}.log`);
    fs.appendFileSync(file, JSON.stringify(data) + '\n');
}

/* ===============================
   PLUGIN
=================================*/

module.exports = function mongoLogger() {

    return function (schema) {

        /* ===== QUERIES ===== */

        const operaciones = [
            'find',
            'findOne',
            'findOneAndUpdate',
            'findOneAndDelete',
            'updateOne',
            'updateMany',
            'deleteOne',
            'deleteMany',
            'count',
            'countDocuments',
            'aggregate'
        ];

        schema.pre(operaciones, function (next) {

            this._startTime = Date.now();

            next();
        });

        schema.post(operaciones, function (result, next) {

            const duration = Date.now() - this._startTime;

            const log = {
                modelo: this.model.modelName,
                operacion: this.op,
                filtro: this.getQuery(),
                update: this.getUpdate ? this.getUpdate() : null,
                duracion_ms: duration,
                fecha: new Date().toISOString()
            };

            // Consola
            console.log(
                chalk.blue('[MONGO]'),
                chalk.yellow(log.modelo),
                chalk.green(log.operacion),
                chalk.gray(`${duration}ms`)
            );

            // Archivo
            writeMongoLog(log);

            if (next) next();
        });

        /* ===== SAVE ===== */

        schema.pre('save', function (next) {
            this._startTime = Date.now();
            next();
        });

        schema.post('save', function (doc, next) {

            const duration = Date.now() - this._startTime;

            const log = {
                modelo: this.constructor.modelName,
                operacion: 'save',
                documento: this.toObject(),
                duracion_ms: duration,
                fecha: new Date().toISOString()
            };

            console.log(
                chalk.green('[MONGO]'),
                chalk.yellow(log.modelo),
                chalk.green('save'),
                chalk.gray(`${duration}ms`)
            );

            writeMongoLog(log);

            if (next) next();
        });

        /* ===== REMOVE ===== */

        schema.pre('remove', function (next) {
            this._startTime = Date.now();
            next();
        });

        schema.post('remove', function (doc, next) {

            const duration = Date.now() - this._startTime;

            const log = {
                modelo: this.constructor.modelName,
                operacion: 'remove',
                documento: this.toObject(),
                duracion_ms: duration,
                fecha: new Date().toISOString()
            };

            console.log(
                chalk.red('[MONGO]'),
                chalk.yellow(log.modelo),
                chalk.red('remove'),
                chalk.gray(`${duration}ms`)
            );

            writeMongoLog(log);

            if (next) next();
        });

    };

};
