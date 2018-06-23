var util = require('util');
var http = require('http');
var path = require('path');
var ecstatic = require('ecstatic');
var io = require('socket.io');

var Human = require('./Human');

var port = process.env.PORT || 3000;

var socket;
var players;
var pedestrians;

var server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err;
  }

  init();
})

function init () {
  players = [];
  pedestrians = [];

  socket = io.listen(server);

  setEventHandlers();
}

var setEventHandlers = function () {
  socket.sockets.on('connection', onSocketConnection);
}

function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id);

  client.on('disconnect', onClientDisconnect);
  client.on('new player', onNewPlayer);
  client.on('new pedestrian', onNewPedestrian);
  client.on('move player', onMovePlayer);
  client.on('move pedestrian', onMovePedestrian);
}

function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id);

  var removePlayer = playerById(this.id);

  if (!removePlayer) {
    util.log('Player not found: ' + this.id);
    return;
  }

  players.splice(players.indexOf(removePlayer), 1);

  this.broadcast.emit('remove player', {id: this.id});
}

function onNewPlayer (data) {
  var newPlayer = new Human(data.x, data.y, data.angle);
  newPlayer.id = this.id;

  this.broadcast.emit('new player', { id: newPlayer.id,
                                      x: newPlayer.getX(),
                                      y: newPlayer.getY(),
                                      angle: newPlayer.getAngle()});

  var i, existingPlayer;

  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i];
    this.emit('new player', { id: existingPlayer.id,
                              x: existingPlayer.getX(),
                              y: existingPlayer.getY(),
                              angle: existingPlayer.getAngle()});
  }

  players.push(newPlayer);
}

function onNewPedestrian (data) {
  var newPedestrian = new Human(data.x, data.y, data.angle);
  newPedestrian.id = this.id;

  this.broadcast.emit('new pedestrian', {id: newPedestrian.id, x: newPedestrian.getX(), y: newPedestrian.getY(), angle: newPedestrian.getAngle()});

  var i, existingPedestrian;

  for (i = 0; i < pedestrians.length; i++) {
    existingPedestrian = pedestrians[i];
    this.emit('new pedestrian', { id: existingPedestrian.id,
                                  x: existingPedestrian.getX(),
                                  y: existingPedestrian.getY(),
                                  angle: existingPedestrian.getAngle()});
  }

  pedestrians.push(newPedestrian);
}

function onMovePlayer (data) {
  var movePlayer = playerById(this.id);

  if (!movePlayer) {
    util.log('Player not found: ' + this.id);
    return;
  }

  movePlayer.setX(data.x);
  movePlayer.setY(data.y);
  movePlayer.setAngle(data.angle);

  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle()});
}

function onMovePedestrian (data) {
  var movePedestrian = pedestrianById(this.id);

  if (!movePedestrian) {
    util.log('Pedestrian not found: ' + this.id);
    return;
  }

  movePedestrian.setX(data.x);
  movePedestrian.setY(data.y);
  movePedestrian.setAngle(data.angle);

  this.broadcast.emit('move pedestrian', { id: movePedestrian.id,
                                       x: movePlayer.getX(),
                                       y: movePlayer.getY(),
                                       angle: movePlayer.getAngle()});
}

function playerById (id) {
  var i;

  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i];
    }
  }

  return false;
}

function pedestrianById (id) {
  var i;

  for (i = 0; i < pedestrian.length; i++) {
    if (pedestrian[i].id === id) {
      return pedestrian[i];
    }
  }

  return false;
}
