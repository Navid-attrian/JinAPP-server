const mysql = require('mysql');
const groups = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'groups'
});

module.exports = groups