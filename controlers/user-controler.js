const path = require('path')
const connect = require('../sql/connect')


const home = ((req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'home.html'))
})

const getAllusers = ((req, res, next) => {
    const read_R = 'SELECT * FROM details';
    connect.getConnection(function (err, connection) {
        connection.query(read_R, (err, data) => {

            if (err) throw err;
            else {
                res.json(data)
            }
        });
        connection.release();
    });
})

const getOneuser = (req, res, next) => {


}



const profileImages = ((req, res, next) => {
    const img = req.url
    if (img === null || img === '' || img === '.jpg' || img === '/.jpg' || img === '/null.jpg') {
        res.sendFile(path.join(__dirname, '../', 'Images', 'profile_pic', 'default.jpg'))
    } else {
        res.sendFile(path.join(__dirname, '../', 'Images', 'profile_pic', img))
    }
})





const adduser = (req, res, next) => {
    const { userName, password, phoneNumber, title } = req.body
    var insert_R = 'INSERT INTO details(username,password,creationDate,phoneNumber,title,profilePic) VALUE(?,?,?,?,?,?)';
    connect.getConnection((err, connection) => {
        connection.query(insert_R, [userName, password, Date(), phoneNumber, title, ''], (err, response) => {
            if (err) throw err;
            else {
                res.json(response)
            }
        });
        connection.release();
    });


}

const deleteuser = (req, res, next) => {
    const delete_R = 'DELETE FROM details WHERE username=?';
    connect.getConnection((err, connection) => {
        connection.query(delete_R, [req.body.userName], (err, response) => {
            if (err) throw err;
            else {
                res.json(response)
            }
        });
        connection.release();
    });


}

exports.getAllusers = getAllusers
exports.getOneuser = getOneuser
exports.adduser = adduser
exports.deleteuser = deleteuser
exports.home = home
exports.images = profileImages