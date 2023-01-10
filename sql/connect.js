const mysql = require('mysql');
const connect = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'users'
});

module.exports = connect