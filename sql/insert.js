const mysql = require('mysql');

const connect = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'users'
});


var insert_R = 'INSERT INTO details(username,password) VALUE(?,?)';
connect.getConnection( (err, connection)=> {
  connection.query(insert_R, ['navid', 'test'],  (err, res)=> {
    if (err) throw err;
    else {
      console.log('Details added successfully');
    }
  });
  connection.release();
});