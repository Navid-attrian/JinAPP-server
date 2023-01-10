var mysql = require('mysql');

var connect = mysql.createPool({
  host: 'localhost',
  user: 'user1',
  password: 'F@rijoon59',
  database: 'users'
});


const read_R = 'SELECT * FROM details';
connect.getConnection(function (err, connection) {
  connection.query(read_R, function (err, data) {
    if (err) throw err;
    else {
      console.log(data);
    }
  });
  connection.release();
});

