#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require("../app");
var debug = require("debug")("gameapp:server");
var https = require("http");
/**
 * set these for ai part
 * */
let aihost = "example.com";
let aipath = "path";
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT | "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = https.createServer(app); // options,

var io = require("socket.io")(server);
io.origins("*:*");
io.set("origins", "*:*");
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

/** io functions : */

let user = require("../models//User");

function search(nameKey, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].id === nameKey) {
      return i;
    }
  }
  return -1;
}
let users = [];
let players = [];


io.use(function(socket, next) {
  // front : var c = io.connect('https:example:437/', { query: "authenticate=$token" });
  let token = socket.request._query["authenticate"];
  console.log(socket.request._query["authenticate"]);
  if (token) {
    jwt.verify(token, "zero-bits01-secret", (err, decoded) => {
      if (err) {
        socket.disconnect();
      } else {
        console.log(decoded.username);
        socket.username = decoded.username;
        next();
      }
    });
  } else {
    socket.disconnect();
  }
}).on("connection", socket => {
  console.log(socket.id);
  console.log(users);
  users.push({
    id: socket.id,
    username: socket.username
  });
  if (users.length == 1) {
    socket.emit("message", { msg: "no online users" });
    console.log("message event emitted");
  } else {
    let p1 = users.shift();
    let p2 = users.shift();
    players.push(p1);
    players.push(p2);
    console.log("start event emitted to both users");
    io.to(p1.id).emit("start", {
      opname: p2.username,
      opid: p2.id,
      playernumber: 0
    });
    io.to(p2.id).emit("start", {
      opname: p1.username,
      opid: p1.id,
      playernumber: 1
    });
  }

  socket.on("ai", () => {
    let index = search(socket.id, users);
    let p = users.splice(index, 1);
    players.push(p);
    io.to(p.id).emit("start", {
      opname: "AI",
      opid: "",
      playernumber: 0
    });
  });

  socket.on("aimovement", data => {
    const options = {
      hostname: aihost,
      port: 80,
      path: aipath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length
      }
    };
    const req = https.request(options, res => {
      res.on("data", d => {
        socket.emit("movement", d);
      });
    });

    req.on("error", error => {
      socket.emit("winner", { msg: "you are the winner" });
    });
    req.write(data);
    req.end();
  });
  socket.on("movement", data => {
    let temp = JSON.parse(data);
    console.log("movement event received with data : " + data);    
    if (
      search(temp.opid, players) > -1 &&
      io.sockets.sockets[temp.opid] != undefined
    ) {
      console.log("movement event emitted with data : " + data);  
      io.to(temp.opid).emit("movement", data);
    } else {
      console.log("opponent left the game winner event emitted");
      socket.emit("winner", { msg: "you are the winner" });
    }
  });

  socket.on("disconnect", () => {
    console.log("user left the socket pool with id : " + socket.id);
    let index = search(socket.id, players);
    if (index > -1) {
      players.splice(index, 1);
    }
  });
});
