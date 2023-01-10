const express = require('express')
const usersRoutes = require('./routs/user-routs')
// const socketio = require('socket.io')
const http = require('http')
const fs = require('fs')
const app = express()
const cors = require('cors')
const connect = require('./sql/connect')
const messagesdb = require('./sql/messages')
const groupsDb = require('./sql/groups')
const server = http.createServer(app)

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});
app.use(cors())
app.use(express.json())
app.use('/', usersRoutes)



const getApiAndEmit = socket => {
  try {
    socket.emit('time', Date())
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
};





let users = []


io.on("connection", socket => {
  socket.join('ALL_USERS')



  console.log(socket.id, "Client connected");
  users.push(socket.id)
  socket.on('login', (data) => {
    socket.emit('login', 'user')
  })

  socket.on('time', () => {
    users[users.length - 1] = setInterval(() => getApiAndEmit(socket), 1000);
  })

  const updateUserData = (username) => {
    const find_R = 'SELECT * FROM details WHERE username=?';
    connect.getConnection((err, connection) => {
      connection.query(find_R, [username], (err, response) => {
        if (err) {
          console.log('User data Updating Error', err)
        }
        else {
          socket.to(username).emit('userDataChanged', response[0])
          socket.emit('userDataChanged', response[0])
        }
      });
      connection.release();
    });
  }


  socket.on('userCreated', data => {
    const read_R = 'SELECT * FROM details';
    connect.getConnection((err, connection) => {
      connection.query(read_R, (err, data) => {
        if (err) {
          console.log('User creation Error finding data in database', err)
        }
        else {
          socket.to('ALL_USERS').emit('userList', data)
        }
      });
      connection.release();
    });
  })

  const updateMessages = (fileName, username) => {
    messagesdb.getConnection(async (err, connection) => {
      const update_R = 'UPDATE userMessages SET senderPic = ? WHERE senderId=?'
      connection.query(update_R, [fileName, username], (err, res) => {
        if (err) {
          console.log('Update user message Error :', err)
        }
      });
      connection.release();
    });

    messagesdb.getConnection(async (err, connection) => {
      const update_R = 'UPDATE groupMessages SET senderPic = ? WHERE senderId=?'
      connection.query(update_R, [fileName, username], (err, res) => {
        if (err) {
          console.log('Update gruop message Error :', err)
        }
      });
      connection.release();
    });
  }

  const saveProfilePic = async ({ blob, username }) => {
    const fileName = username + (Math.random() * 25).toString(36)
    try {
      fs.writeFile(__dirname + `/Images/profile_pic/${fileName}.jpg`, blob, function (err) {
        if (err) {
          console.log('Saving profile picture file Error:', err)
        }
      });
      const read_R = 'SELECT * FROM details WHERE username=?';
      connect.getConnection((err, connection) => {
        connection.query(read_R, [username], async (err, data) => {
          if (err) {
            console.log('Save Profile picture Error finding data in database', err)
          }
          else {
            const array = fileName + '  ' + data[0].profilePic
            connect.getConnection(async (err, connection) => {
              const update_R = 'UPDATE details SET profilePic = ? WHERE username=?'
              connection.query(update_R, [array, username], (err, res) => {
                if (err) {
                  console.log('Save Profile picture Error', err)
                }
                else {
                  socket.emit('updateProfilePicture', array)
                  socket.to(username).emit('updateProfilePicture', array)
                }
              });
              connection.release();
            });

            updateMessages(fileName, username)
            updateUserData(username)
          }
        });
        connection.release();
      });
    } catch (error) {
    }
  }
  socket.on('sendProfilePicture', data => {
    saveProfilePic(data)
  })




  socket.on('deleteProfilePicture', ({ item, profilePic, username }) => {
    connect.getConnection(async (err, connection) => {
      var update_R = 'UPDATE details SET profilePic = ? WHERE username=?'
      connection.query(update_R, [profilePic, username], (err, res) => {
        if (err) {
          console.log('Delete profile picture Error', err)
        }
        else {
          socket.emit('updateProfilePicture', profilePic)
          socket.to(username).emit('updateProfilePicture', profilePic)
          const fileName = profilePic.split('  ')[0]
          updateMessages(fileName, username)
          updateUserData(username)
        }
      });
      connection.release();
    });
    fs.rm(__dirname + `/Images/profile_pic/${item}.jpg`, function (err) {
      if (err) {
        console.log('Profile picture removing file Error:', err)
      }
    })
  })


  socket.on('changeProfilePicture', ({ profilePic, username }) => {
    connect.getConnection(async (err, connection) => {
      var update_R = 'UPDATE details SET profilePic = ? WHERE username=?'
      connection.query(update_R, [profilePic, username], (err, res) => {
        if (err) {
          console.log('Change profile picture Error:', err)
        }
        else {
          socket.emit('updateProfilePicture', profilePic)
          socket.to(username).emit('updateProfilePicture', profilePic)
          const fileName = profilePic.split('  ')[0]
          updateMessages(fileName, username)
          updateUserData(username)
        }
      });
      connection.release();
    });
  })



  socket.on('titleChange', ({ title, username }) => {
    connect.getConnection(async (err, connection) => {
      var update_R = 'UPDATE details SET title = ? WHERE username=?'
      connection.query(update_R, [title, username], (err, res) => {
        if (err) {
          console.log('Title Change error:', err)
          socket.emit('titleChangeError',err)
        }
        else {

          messagesdb.getConnection(async (err, connection) => {
            const update_R = 'UPDATE userMessages SET senderTitle = ? WHERE senderId=?'
            connection.query(update_R, [title, username], (err, res) => {
              if (err) {
                console.log('Update user message title Error', err)
              }
            });
            connection.release();
          });

          messagesdb.getConnection(async (err, connection) => {
            const update_R = 'UPDATE groupMessages SET senderTitle = ? WHERE senderId=?'
            connection.query(update_R, [title, username], (err, res) => {
              if (err) {
                console.log('Update group message title Error', err)
              }
            });
            connection.release();
          });

          const read_R = 'SELECT * FROM details';
          connect.getConnection((err, connection) => {
            connection.query(read_R, (err, data) => {
              if (err) {
                console.log('Title change Error finding data in database', err)
              }
              else {
                socket.to('ALL_USERS').emit('userList', data)
                
              }
            });
            connection.release();
          });
          updateUserData(username)
        }
      });
      connection.release();
    });

  })

  socket.on('updateProfilePicture', ({ username }) => {
    const read_R = 'SELECT * FROM details WHERE username=?';
    connect.getConnection((err, connection) => {
      connection.query(read_R, [username], async (err, data) => {
        if (err) {
          console.log('Update Profile Picture Error finding data in database', err)
        }
        else {
          socket.emit('updateProfilePicture', data[0].profilePic)
          socket.to(username).emit('updateProfilePicture', data[0].profilePic)
        }
      });
      connection.release();
    });
    updateUserData(username)
  })



  socket.on('userList', data => {
    const read_R = 'SELECT * FROM details';
    connect.getConnection((err, connection) => {
      connection.query(read_R, (err, data) => {
        if (err) {
          console.log('User List Error reading data from database', err)
        }
        else {
          socket.emit('userList', data)
        }
      });
      connection.release();
    });
  })


  socket.on('validate', data => {
    const find_R = 'SELECT * FROM details WHERE username=?';
    connect.getConnection((err, connection) => {
      connection.query(find_R, [data.username], (err, response) => {
        if (err) {
          socket.emit('validate', 'Error in server')
        }
        else {
          if (response[0]) {
            if (response[0].password === data.password) {
              socket.join(response[0].username)
              socket.emit('validate', response[0])
            } else {
              socket.emit('validate', 'incorectPassword')
            }
          } else {
            socket.emit('validate', 'NotUser')
          }
        }
      });
      connection.release();
    });
  })

  socket.on('chatJoin', data => {
    socket.join(`${data.reciver}${data.sender}`)
    socket.join(`${data.sender}${data.reciver}`)
    const info = data
    let rTos = ''
    let sTor = ''
    const find_R = 'SELECT * FROM userMessages WHERE senderId = ? && reciverId = ?';
    messagesdb.getConnection((err, connection) => {
      connection.query(find_R, [info.sender, info.reciver], (err, data) => {
        if (err) {
          console.log('Chat join Error finding data in database 1:', err)
        }
        else {
          sTor = data

          const find_R = 'SELECT * FROM userMessages WHERE reciverId = ? && senderId = ?';
          messagesdb.getConnection((err, connection) => {
            connection.query(find_R, [info.sender, info.reciver], (err, data) => {
              if (err) {
                console.log('Chat join Error finding data in database 2:', err)
              }
              else {
                rTos = data
                socket.emit('personalMessage', { sTor, rTos })
              }
            });
            connection.release();
          });

        }
      });
      connection.release();
    });
  })



  socket.on('personalMessage', data => {
    const info = data
    let rTos = ''
    let sTor = ''
    const insert_R = 'INSERT INTO userMessages(senderId,reciverId,date,message,senderTitle,senderPic) VALUE(?,?,?,?,?,?)';
    messagesdb.getConnection((err, connection) => {
      connection.query(insert_R, [data.sender, data.reciver, Date(), data.message, data.title, data.senderPic], (err, res) => {
        if (err) {
          console.log('Personal message database Inserting Error:', err)
        }
        else {
          const find_R = 'SELECT * FROM userMessages WHERE senderId = ? && reciverId = ?';
          messagesdb.getConnection((err, connection) => {
            connection.query(find_R, [info.sender, info.reciver], (err, data) => {
              if (err) {
                console.log('Personal messagee Error finding data in database 1:', err)
              }
              else {
                sTor = data
                const find_R = 'SELECT * FROM userMessages WHERE reciverId = ? && senderId = ?';
                messagesdb.getConnection((err, connection) => {
                  connection.query(find_R, [info.sender, info.reciver], (err, data) => {
                    if (err) {
                      console.log('Personal messagee Error finding data in database 2:', err)
                    }
                    else {
                      rTos = data
                      socket.to(info.reciver).emit('notification',{sender:`You have new message from ${info.title}`,message:info.message})
                      socket.to(`${info.sender}${info.reciver}`).emit('personalMessage', { sTor, rTos })
                      socket.emit('personalMessage', { sTor, rTos })
                    }
                  });
                  connection.release();
                });
              }
            });
            connection.release();
          });
        }
      });
      connection.release();
    });
  })

  socket.on('personalMessageDelete', data => {
    const info = data
    let rTos = ''
    let sTor = ''
    const delete_R = 'DELETE FROM userMessages WHERE id=?';
    messagesdb.getConnection((err, connection) => {
      connection.query(delete_R, [info.id], (err, res) => {
        if (err) {
          console.log('Personal Message deleting Error:', err)
        }
        else {
          const find_R = 'SELECT * FROM userMessages WHERE senderId = ? && reciverId = ?';
          messagesdb.getConnection((err, connection) => {
            connection.query(find_R, [info.sender, info.reciver], (err, data) => {
              if (err) {
                console.log('Personal Message deleting Error finding data in database 1:', err)
              }
              else {
                sTor = data
                const find_R = 'SELECT * FROM userMessages WHERE reciverId = ? && senderId = ?';
                messagesdb.getConnection((err, connection) => {
                  connection.query(find_R, [info.sender, info.reciver], (err, data) => {
                    if (err) {
                      console.log('Personal Message deleting Error finding data in database 2:', err)
                    }
                    else {
                      rTos = data
                      socket.to(`${info.sender}${info.reciver}`).emit('personalMessage', { sTor, rTos })
                      socket.emit('personalMessage', { sTor, rTos })
                    }
                  });
                  connection.release();
                });
              }
            });
            connection.release();
          });
        }
      });
      connection.release();
    });
  })



  socket.on('messageDelete', data => {
    const room = data.roomId
    var delete_R = 'DELETE FROM groupMessages WHERE id=?';
    messagesdb.getConnection((err, connection) => {
      connection.query(delete_R, [data.id], (err, res) => {
        if (err) {
          console.log('Group message deleting Error:', err)
        }
        else {
          var find_R = 'SELECT * FROM groupMessages WHERE groupId =?';
          setTimeout(() =>
            messagesdb.getConnection((err, connection) => {
              connection.query(find_R, [room], (err, data) => {
                if (err) {
                  console.log('Group message deleting Error finding data in database', err)
                }
                else {
                  socket.to(room).emit('refresh', data)
                }
              });
              connection.release();
            }), 1000)
        }
      });
      connection.release();
    });
  })


  socket.on('newMessage', data => {
    const room = data.roomId
    var insert_R = 'INSERT INTO groupMessages(senderId,date,message,groupId,senderTitle,senderPic) VALUE(?,?,?,?,?,?)';
    messagesdb.getConnection(function (err, connection) {
      connection.query(insert_R, [data.sender, Date(), data.message, room, data.senderTitle, data.senderPic], (err, res) => {
        if (err) {
          console.log('Group message inserting Error :', err)
        }
        else {
          var find_R = 'SELECT * FROM groupMessages WHERE groupId =?';
          messagesdb.getConnection(function (err, connection) {
            connection.query(find_R, [room], (err, data) => {
              if (err) {
                console.log('Group message inserting Error finding data in database :', err)
              }
              else {
                socket.to(room).emit('message', data)
              }
            });
            connection.release();
          });
        }
      });
      connection.release();
    });
  })


  socket.on('refresh', data => {
    socket.join(data)
    var find_R = 'SELECT * FROM groupMessages WHERE groupId =?';
    messagesdb.getConnection((err, connection) => {
      connection.query(find_R, [data], (err, data) => {
        if (err) {
          console.log('In refresh Error finding data in database :', err)
        }
        else {
          socket.emit('refresh', data)
        }
      });
      connection.release();
    });
  })

  socket.on('groupList', data => {
    var find_R = 'SELECT * FROM details';
    groupsDb.getConnection((err, connection) => {
      connection.query(find_R, (err, data) => {
        if (err) {
          console.log('Group List Error finding data in database :', err)
        }
        else {
          socket.emit('groupList', data)
        }
      });
      connection.release();
    });
  })


  socket.on('newGroup', data => {
    const insert_R = 'INSERT INTO details(title,creatorId,create_date) VALUE(?,?,?)';
    groupsDb.getConnection(function (err, connection) {
      connection.query(insert_R, [data.title, data.creator, Date()], function (err, res) {
        if (err) {
          console.log('New Group inserting Error :', err)
        }
        else {
          console.log('Details added successfully');
          var find_R = 'SELECT * FROM details';
          groupsDb.getConnection((err, connection) => {
            connection.query(find_R, (err, data) => {
              if (err) {
                console.log('New Group inserting Error finding data in database :', err)
              }
              else {
                socket.emit('groupList', data)
                socket.to('ALL_USERS').emit('groupList', data)
              }
            });
            connection.release();
          });
        }
      });
      connection.release();
    });
  })

  socket.on('groupDelete', data => {
    var delete_R = 'DELETE FROM details WHERE id=?';
    groupsDb.getConnection((err, connection) => {
      connection.query(delete_R, [data], (err, res) => {
        if (err) {
          console.log('Group deleting Error :', err)
        }
        else {
          console.log('group deleted')
          var find_R = 'SELECT * FROM details';
          groupsDb.getConnection((err, connection) => {
            connection.query(find_R, (err, data) => {
              if (err) {
                console.log('Group deleting Error finding data in database :', err)
              }
              else {
                socket.emit('groupList', data)
                socket.to('ALL_USERS').emit('groupList', data)
              }
            });
            connection.release();
          });
        }
      });
      connection.release();
    });
  })




  socket.on("disconnect", () => {
    console.log(socket.id, "Client disconnected");
    socket.disconnect()
  });
});


server.listen(1980)

















