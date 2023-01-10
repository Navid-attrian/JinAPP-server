const mysql = require('mysql');
const messages = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'messages'
});

module.exports = messages