var www = require('../bin/www');
let user = require('../models//User');

function search(nameKey, myArray){
  for (var i=0; i < myArray.length; i++) {
      if (myArray[i].username === nameKey) {
          return i;
      }
  }
  return -1;
}
 
www.io.use(function(socket, next) {
  // front : var c = www.io.connect('https:example:437/', { query: "authenticate=$token" });
  console.log('new user connected');
  let token = socket.request._auth['authenticate'];
  if (token) {
      jwt.verify(token, "zero-bits01-secret", (err, decoded) => {
          if (err) {
            socket.disconnect();
          } else {
              socket.username = decoded;
              next();
          }
      });
  } else {
    socket.disconnect();
  }
});

www.io.on('connection', (socket) => {  
  let users = [];
  let players = [];
  users.push({
    id : socket.id,
    username : socket.username
  });

  if(users.length < 2){
    socket.emit('message', {msg : 'no online users'});
    //socket.disconnect();
  }else{
    var rndmuser = users[Math.floor(Math.random()*users.length)];
    
    let index = search(socket.username, users);
    let p1,p2;
    if (index > -1) {
      p1 = users.splice(index, 1);
      let index1= search(rndmuser.username, users);
      p2 = users.splice(index1, 1);
    }
    players.push(p1);
    players.push(p2);

    socket.emit('start', {opname : rndmuser.username, opid : rndmuser.id});
    socket.broadcast().to(rndmuser.id).emit('start' , {
      opname : socket.username,
      opid : socket.id
    });
  
  }


  socket.on('movement' , (data) => {
    if(search(data.opid, users) > -1 && www.io.sockets.sockets[data.opid] != undefined){
      socket.broadcast().to(data.opid).emit('movement', data);
    }else{
      socket.emit('winner', {msg : 'you are the winner'});
    }
  });

  socket.on('disconnect', () => {
    let index = search(socket.username, players);
    let index1= search(socket.username, players);
    if (index > -1) {
      players.splice(index, 1);
    }
    if(index1 > -1){
      users.splice(index, 1);
    }
  });
});
