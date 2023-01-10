
//name of the file : update-mysql.js
var mysql = require('mysql');

var connect =  mysql.createPool({
host : 'localhost',
user : 'root',
password: '12345678',
database: 'mytest'
});


var update_R = 'UPDATE details SET age = ? WHERE name=?';
//establishing connection
connect.getConnection(function(err, connection){
    
  //Updating a record from details
  connection.query(update_R,[35,'fariba'], function(err, res){
    if(err) throw err;
    else {
        console.log('Updated the age of navid !');
    }
  });

//releasing connection
 connection.release();

});