//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var users = [];
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var masterUser = 'jinan'
      , masterPass = 'presentation';
 
// Authentication
var auth = express.basicAuth(masterUser, masterPass);
 
router.get('/', auth, function(req, res){
  
  res.sendfile(path.resolve(__dirname, 'presentation') + '/index.html');
});
 router.get('/client',  function(req, res){
  
  res.sendfile(path.resolve(__dirname, 'presentation') + '/client.html');
});
//router.use(express.static(path.resolve(__dirname, 'client')));

router.use(express.static(path.resolve(__dirname, 'presentation')));


var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });
    
    socket.on("slidechanged", function(data){
      console.log(data)
  socket.broadcast.emit("slidechanged", data);
});

socket.on('newuser',function(data){
  console.log(data);
  users.push(data);
  socket.broadcast.emit('newuser',users);
})
    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
