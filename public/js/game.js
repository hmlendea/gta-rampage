let log = console.log;

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload, create, update,});

var socket, land, player, enemies = [], speed = 0, prevPos;

function preload() {
  game.load.image('earth', 'assets/light_sand.png')
  game.load.spritesheet('dude', 'assets/dude.png', 64, 64)
  game.load.spritesheet('enemy', 'assets/dude.png', 64, 64)
}

function create() {
  log('create game');
  game.world.setBounds(-500, -500, 1000, 1000); //game world 2000 x 2000
  // create land
  land = game.add.tileSprite(0, 0, 800, 600, 'earth');
  land.fixedToCamera = true;
  // create player
  var x = Math.round(Math.random() * (1000) - 500);
  var y = Math.round(Math.random() * (1000) - 500);
  prevPos = {x, y};
  player = game.add.sprite(x, y, 'dude');
  player.anchor.setTo(0.5, 0.5);
  player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  player.animations.add('stop', [3], 20, true);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;
  player.bringToTop();
  // prepare camera
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);
  // set event handlers
  socket = io.connect();
  socket.on('connect', onSocketConnected);
  socket.on('disconnect', onSocketDisconnect);
  socket.on('new player', onNewPlayer);
  socket.on('move player', onMovePlayer);
  socket.on('remove player', onRemovePlayer);
}

function onSocketConnected() {
  log('connected to server');
  enemies.forEach(enemy => enemy.player.kill());
  enemies = [];
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
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle));
}

function onMovePlayer(data) {
  log(`move player: ${data.id}`);
  var movePlayer = playerById(data.id);
  if (!movePlayer) {
    log(`player not found: ${data.id}`);
    return;
  }
  movePlayer.player.x = data.x;
  movePlayer.player.y = data.y;
  movePlayer.player.angle = data.angle;
}

function onRemovePlayer(data) {
  log(`remove player: ${data.id}`);
  var removePlayer = playerById(data.id);
  if (!removePlayer) {
    log(`player not found: ${data.id}`);
    return;
  }
  removePlayer.player.kill()
  enemies.splice(enemies.indexOf(removePlayer), 1)
}

function update() {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update()
      game.physics.arcade.collide(player, enemies[i].player)
    }
  }
  if (speed > 0) {
    speed -= 4
  }
  game.physics.arcade.velocityFromRotation(player.rotation, speed, player.body.velocity)
  player.animations.play(speed > 0 ? 'move' : 'stop');
  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y
  if (game.input.activePointer.isDown) {
    if (game.physics.arcade.distanceToPointer(player) >= 10) {
      speed = 300
      player.rotation = game.physics.arcade.angleToPointer(player)
    }
  }
  if (player.x != prevPos.x || player.y != prevPos.y) {
    socket.emit('move player', {x: player.x, y: player.y, angle: player.angle});
    prevPos = {x: player.x, y: player.y};
  }
}

function playerById(id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }
  return false
}
