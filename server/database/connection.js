const mongoose = require('mongoose');
const Counter = require('../database/models/orden.model');

mongoose.connect('mongodb://localhost:27017/imprenta', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
}, (err, res) => {
    if (err) throw err;

    console.log('Base de datos ONLINE to ', 'mongodb://localhost:27017/imprenta')
});

// mongoose.set('debug', function (collectionName, method, query, doc, options) {
//     console.log(
//         `[MONGOOSE] ${collectionName}.${method} →`,
//         JSON.stringify(query)
//     );
// });

module.exports = mongoose;