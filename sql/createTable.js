var mysql = require('mysql');

var connect =  mysql.createPool({
host : 'localhost',
user : 'root',
password: '12345678',
database: 'users'
});

var table = "CREATE TABLE details (id int(15) NOT NULL AUTO_INCREMENT,"+
    "username varchar(30) DEFAULT NULL,"+
    "password varchar(30) DEFAULT NULL,"+
    "PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

//establishing connection
connect.getConnection(function(err, connection){    
  //Creating details table
  connection.query(table,  function(err){
    if(err) throw err;
    else {
        console.log('Table created Successfully!');
    }
  });

//releasing connection
 connection.release();

});