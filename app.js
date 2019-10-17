var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require('cors');
var mp = "zbits1110098";
var mongoose = require("mongoose");
var debug = require("debug")("gameapp:server");
var http = require("http");
let aihost = "example.com";
let aipath = "path";
// test comment 

// var config = JSON.parse(process.env.APP_CONFIG); ############

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

console.log('******** start of the app ******** \n');

/*mongoose.connect(
  "mongodb://" +
    config.mongo.user +
    ":" +
    encodeURIComponent(mp) +
    "@" +
    config.mongo.hostString
);
########################################
*/
mongoose.connect('mongodb://localhost:27017/GameApp');
mongoose.connection.on('connect' , () => {
  console.log('connected to mongodb');
});

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();
app.use(cors());
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;


var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

var server = http.createServer(app); // options,
var io = require("socket.io")(server);


server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

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

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

/** io functions : */

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
io.on("connection", socket => {
  console.log(socket.id + 'tries to connect')
  if (search(socket.id, users) == -1) {
    users.push({
      id: socket.id,
      // username: socket.username
    });
    console.log('sockket connected : ' + socket.id);
  }
  if (users.length < 2) {
    socket.emit("message", { msg: "no online users" });
  } else {
    let p1 = users.shift();
    let p2 = users.shift();
    players.push(p1);
    players.push(p2);
    io.to(p1.id).emit("start", {
      // opname: p2.username,
      opid: p2.id,
      playernumber: 0
    });
    io.to(p2.id).emit("start", {
      // opname: p1.username,
      opid: p1.id,
      playernumber: 1
    });
  }

  socket.on("ai", () => {
    let index = search(socket.id, users);
    let p = users.splice(index, 1);
    players.push(p);
    io.to(p.id).emit("start", {
      // opname: "AI",
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
    const req = http.request(options, res => {
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
    if (
      search(data.opid, players) > -1 &&
      io.sockets.sockets[data.opid] != undefined
    ) {
      io.to(data.opid).emit("movement", data);
    } else {
      socket.emit("winner", { msg: "you are the winner" });
    }
  });

  socket.on("disconnect", () => {
    let index = search(socket.id, players);
    if (index > -1) {
      players.splice(index, 1);
    }
  });
});
