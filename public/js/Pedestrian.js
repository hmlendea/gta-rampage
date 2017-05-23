/* global game */

var Pedestrian = function (index, game, human, startX, startY, startAngle) {
  var x = startX;
  var y = startY;
  var angle = startAngle;

  this.game = game;
  this.human = human;
  this.alive = true;

  this.human = game.add.sprite(x, y, 'pedestrian');

  this.human.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  this.human.animations.add('stop', [3], 20, true);

  this.human.anchor.setTo(0.5, 0.5);

  this.human.name = index.toString();
  game.physics.enable(this.human, Phaser.Physics.ARCADE);
  this.human.body.immovable = true;
  this.human.body.collideWorldBounds = true;

  this.human.angle = angle;

  this.lastPosition = { x: x, y: y, angle: angle };
}

Pedestrian.prototype.update = function () {
  if (this.human.x !== this.lastPosition.x ||
      this.human.y !== this.lastPosition.y ||
      this.human.angle != this.lastPosition.angle) {
    this.human.play('move');
    this.human.rotation = Math.PI +
                           game.physics.arcade.angleToXY(this.human,
                                                         this.lastPosition.x,
                                                         this.lastPosition.y);
  } else {
    this.human.play('stop');
  }

  this.lastPosition.x = this.human.x;
  this.lastPosition.y = this.human.y;
  this.lastPosition.angle = this.human.angle;
}

window.Pedestrian = Pedestrian;
