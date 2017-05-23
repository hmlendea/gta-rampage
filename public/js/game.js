let log = console.log;

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload, create, update,});

var socket, land, speed = 0, prevPos;

var player, players = [];
var pedestrians = [];

function preload() {
  game.load.image('earth', 'assets/city1.png');
  game.load.spritesheet('player', 'assets/player.png', 32, 32);
  game.load.spritesheet('player_other', 'assets/player_other.png', 32, 32);
  game.load.spritesheet('pedestrian', 'assets/pedestrian.png', 32, 32);
}

var worldSizeX = 1000;
var worldSizeY = 1000;

var canvasSizeX = 800;
var canvasSizeY = 600;

function create() {
  log('create game');
  game.world.setBounds(-worldSizeX / 2, -worldSizeY / 2, worldSizeX, worldSizeY);

  // Create the land
  land = game.add.tileSprite(0, 0, canvasSizeX, canvasSizeY, 'earth');
  land.fixedToCamera = true;

  // create player
  var x = Math.round(Math.random() * (worldSizeX) - worldSizeX / 2);
  var y = Math.round(Math.random() * (worldSizeY) - worldSizeY / 2);

  prevPos = {x, y};

  // Setup the player
  player = game.add.sprite(x, y, 'player');
  player.anchor.setTo(0.5, 0.5);
  player.animations.add('move', [0, 1, 2, 3, 4], 10, true);
  player.animations.add('stop', [4, 5], 2, true);

  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;
  player.bringToTop();

  // Setup the camera
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);

  // Setup the event handlers
  socket = io.connect();
  socket.on('connect', onSocketConnected);
  socket.on('disconnect', onSocketDisconnect);
  socket.on('new player', onNewPlayer);
  socket.on('new pedestrian', onNewPedestrian);
  socket.on('move player', onMovePlayer);
  socket.on('move pedestrian', onMovePedestrian);
  socket.on('remove player', onRemovePlayer);
  socket.on('remove pedestrian', onRemovePedestrian);
}

function onSocketConnected() {
  log('connected to server');
  players.forEach(player => player.human.kill());
  players = [];
  socket.emit('new player', {x: player.x, y: player.y, angle: player.angle});
}

function onSocketDisconnect() {
  log('disconnected from server')
}

function onNewPlayer(data) {
  log(`new player connected: ${data.id}`);
  var duplicate = playerById(data.id);
  
  if (duplicate) {
    log('duplicate player!');
    return;
  }
  
  players.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle));
}

function onNewPedestrian(data) {
  log(`new pedestrian spawned: ${data.id}`);
  var duplicate = pedestrianById(data.id);
  
  if (duplicate) {
    log('duplicate pedestrian!');
    return;
  }
  
  pedestrians.push(new Pedestrian(data.id, game, player, data.x, data.y, data.angle));
}

function onMovePlayer(data) {
  log(`move player: ${data.id}`);
  var movePlayer = playerById(data.id);

  if (!movePlayer) {
    log(`player not found: ${data.id}`);
    return;
  }

  movePlayer.human.x = data.x;
  movePlayer.human.y = data.y;
  movePlayer.human.angle = data.angle;
}

function onMovePedestrian(data) {
  log(`move pedestrian: ${data.id}`);
  var movePedestrian = pedestrianById(data.id);

  if (!movePedestrian) {
    log(`pedestrian not found: ${data.id}`);
    return;
  }

  movePedestrian.human.x = data.x;
  movePedestrian.human.y = data.y;
  movePedestrian.human.angle = data.angle;
}

function onRemovePlayer(data) {
  log(`remove player: ${data.id}`);
  var removePlayer = playerById(data.id);

  if (!removePlayer) {
    log(`player not found: ${data.id}`);
    return;
  }

  removePlayer.human.kill()
  players.splice(players.indexOf(removePlayer), 1)
}

function onRemovePedestrian(data) {
  log(`remove pedestrian: ${data.id}`);
  var removePedestrian = pedestrianById(data.id);

  if (!removePedestrian) {
    log(`pedestrian not found: ${data.id}`);
    return;
  }

  removePedestrian.human.kill()
  pedestrians.splice(pedestrians.indexOf(removePedestrian), 1)
}

function update() {
  for (var i = 0; i < players.length; i++) {
    if (players[i].alive) {
      players[i].update();
      game.physics.arcade.collide(player, players[i].human);
    }
  }

  for (var i = 0; i < pedestrians.length; i++) {
    if (pedestrians[i].alive) {
      pedestrians[i].update();
      game.physics.arcade.collide(player, pedestrians[i].human);
    }
  }

  if (speed > 0) {
    speed -= 4;
  }

  game.physics.arcade.velocityFromRotation(player.rotation, speed, player.body.velocity);
  player.animations.play(speed > 0 ? 'move' : 'stop');
  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;

  if (game.input.activePointer.isDown) {
    if (game.physics.arcade.distanceToPointer(player) >= 10) {
      speed = 300;
      player.rotation = game.physics.arcade.angleToPointer(player);
    }
  }

  if (player.x != prevPos.x || player.y != prevPos.y) {
    socket.emit('move player', {x: player.x, y: player.y, angle: player.angle});
    prevPos = {x: player.x, y: player.y};
  }
}

function playerById(id) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].human.name === id) {
      return players[i];
    }
  }
  
  return false;
}

function pedestrianById(id) {
  for (var i = 0; i < pedestrians.length; i++) {
    if (pedestrians[i].human.name === id) {
      return pedestrians[i];
    }
  }
  
  return false;
}
