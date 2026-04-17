const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const FLOOR_Y = 448;
const LEVEL_WIDTH = 2400;

class MainScene extends Phaser.Scene {
  constructor() {
    super("main-scene");
  }

  preload() {
    this.createPalette();
    this.createTextures();
  }

  create() {
    this.isAttacking = false;
    this.isDodging = false;
    this.lastAttackTime = 0;
    this.lastDodgeTime = 0;

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT + 200);
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor("#07070c");
    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(true);

    this.addParallax();
    this.createPlatforms();
    this.createPlayer();
    this.createEnemy();
    this.createAtmosphere();
    this.createHud();
    this.setupCollisions();
    this.setupCamera();
    this.setupInput();
  }

  update(time) {
    this.updateMovement();
    this.updateAttackWindow(time);
    this.updateDodgeWindow(time);
    this.updateEnemyBehavior(time);
    this.updateHud();
    this.updateAtmosphere();
  }

  createPalette() {
    this.palette = {
      sky: 0x09080f,
      mist: 0x8d97b8,
      stone: 0x332f3d,
      stoneLight: 0x5a5461,
      moon: 0xd8d2c2,
      player: 0xd8d1c0,
      playerCape: 0x8b2d3b,
      enemy: 0x7e7a87,
      enemyGlow: 0xca5959,
      slash: 0xf0d9c3,
      lantern: 0xf59e62,
      health: 0xc94d4d,
      stamina: 0x7ba07e,
      uiPanel: 0x100f17
    };
  }

  createTextures() {
    this.makeRectTexture("pixel", 4, 4, this.palette.player);
    this.makeRectTexture("ground", 128, 32, this.palette.stone);
    this.makeRectTexture("pillar", 48, 160, this.palette.stoneLight);
    this.makeRectTexture("ledge", 96, 16, 0x413946);
    this.makeRectTexture("mist", 180, 54, this.palette.mist, 0.18);
    this.makeRectTexture("player-body", 24, 40, this.palette.player);
    this.makeRectTexture("player-cape", 18, 18, this.palette.playerCape);
    this.makeRectTexture("enemy-body", 26, 34, this.palette.enemy);
    this.makeRectTexture("enemy-eye", 8, 4, this.palette.enemyGlow);
    this.makeRectTexture("hitbox", 42, 18, this.palette.slash, 0.28);
    this.makeRectTexture("moon", 52, 52, this.palette.moon);
    this.makeRectTexture("grave", 22, 34, 0x514956);
    this.makeRectTexture("torch", 10, 24, this.palette.lantern);
  }

  makeRectTexture(key, width, height, color, alpha = 1) {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(color, alpha);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  addParallax() {
    this.add.rectangle(LEVEL_WIDTH / 2, GAME_HEIGHT / 2, LEVEL_WIDTH, GAME_HEIGHT, this.palette.sky);

    const moon = this.add.image(780, 110, "moon").setScrollFactor(0.12);
    moon.setAlpha(0.85);

    this.farSpikes = this.add.tileSprite(LEVEL_WIDTH / 2, 380, LEVEL_WIDTH, 120, "pillar")
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0.18)
      .setAlpha(0.18)
      .setTint(0x1f1a28);

    this.midRuins = this.add.tileSprite(LEVEL_WIDTH / 2, 340, LEVEL_WIDTH, 180, "pillar")
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0.34)
      .setAlpha(0.18)
      .setTint(0x2b2432);

    for (let i = 0; i < 16; i += 1) {
      const x = 120 + i * 150;
      const height = 70 + (i % 4) * 18;
      this.add.rectangle(x, FLOOR_Y - height / 2, 24, height, 0x1f1b27)
        .setOrigin(0.5)
        .setScrollFactor(0.42);
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    const floor = this.platforms.create(LEVEL_WIDTH / 2, FLOOR_Y + 16, "ground");
    floor.setDisplaySize(LEVEL_WIDTH, 64);
    floor.refreshBody();

    const platformData = [
      { x: 370, y: 380, key: "ledge" },
      { x: 640, y: 320, key: "ledge" },
      { x: 980, y: 360, key: "ledge" },
      { x: 1260, y: 290, key: "ledge" },
      { x: 1540, y: 250, key: "ledge" },
      { x: 1840, y: 355, key: "ledge" },
      { x: 2120, y: 300, key: "ledge" }
    ];

    platformData.forEach(({ x, y, key }) => {
      this.platforms.create(x, y, key).refreshBody();
    });

    const decoGroup = this.add.group();
    [190, 510, 920, 1350, 1710, 2220].forEach((x, index) => {
      decoGroup.create(x, FLOOR_Y - 14, index % 2 === 0 ? "grave" : "torch");
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(120, 340, "player-body");
    this.player.setOrigin(0.5, 1);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 38).setOffset(2, 2);
    this.player.setDragX(1800);
    this.player.setMaxVelocity(230, 620);

    this.playerCape = this.add.image(this.player.x - 6, this.player.y - 18, "player-cape");
    this.playerCape.setOrigin(0.5, 1);

    this.attackHitbox = this.physics.add.sprite(-100, -100, "hitbox");
    this.attackHitbox.body.allowGravity = false;
    this.attackHitbox.setVisible(false);
    this.attackHitbox.active = false;

    this.playerState = {
      facing: 1,
      health: 5,
      stamina: 100,
      invulnerableUntil: 0
    };
  }

  createEnemy() {
    this.enemy = this.physics.add.sprite(860, 320, "enemy-body");
    this.enemy.setOrigin(0.5, 1);
    this.enemy.setBounce(0);
    this.enemy.body.setSize(22, 32).setOffset(2, 2);
    this.enemy.setCollideWorldBounds(true);

    this.enemyEye = this.add.image(this.enemy.x, this.enemy.y - 22, "enemy-eye");
    this.enemyState = {
      health: 4,
      direction: -1,
      speed: 38,
      awakeDistance: 230,
      hitCooldownUntil: 0
    };
  }

  createAtmosphere() {
    this.mistGroup = this.add.group();
    for (let i = 0; i < 7; i += 1) {
      const mist = this.add.image(160 + i * 300, 160 + (i % 3) * 60, "mist");
      mist.setAlpha(0.12 + (i % 2) * 0.06);
      mist.setScrollFactor(0.22 + (i % 3) * 0.08);
      this.mistGroup.add(mist);
    }

    this.rain = this.add.particles(0, 0, "pixel", {
      x: { min: 0, max: LEVEL_WIDTH },
      y: { min: -10, max: GAME_HEIGHT },
      quantity: 4,
      lifespan: 900,
      speedY: { min: 280, max: 420 },
      speedX: { min: -80, max: -40 },
      scale: { start: 0.35, end: 0.05 },
      alpha: { start: 0.4, end: 0.08 },
      tint: [0x95a2c9]
    });
    this.rain.setScrollFactor(0.1);

    this.vignette = this.add.rectangle(LEVEL_WIDTH / 2, GAME_HEIGHT / 2, LEVEL_WIDTH, GAME_HEIGHT, 0x000000, 0.1)
      .setScrollFactor(0);

    this.torchLights = [520, 1350, 2220].map((x) =>
      this.add.circle(x, FLOOR_Y - 34, 38, this.palette.lantern, 0.12)
    );
  }

  createHud() {
    const camera = this.cameras.main;

    this.hudPanel = this.add.rectangle(160, 60, 260, 88, this.palette.uiPanel, 0.7)
      .setStrokeStyle(1, 0xc7b48a, 0.18)
      .setScrollFactor(0);

    this.healthLabel = this.add.text(40, 30, "VIDA", {
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
      color: "#efe6d3"
    }).setScrollFactor(0);

    this.staminaLabel = this.add.text(40, 64, "AGUANTE", {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#b9c8aa"
    }).setScrollFactor(0);

    this.healthBarBg = this.add.rectangle(180, 34, 150, 12, 0x2a1820).setScrollFactor(0);
    this.healthBar = this.add.rectangle(105, 34, 150, 12, this.palette.health).setOrigin(0, 0.5).setScrollFactor(0);

    this.staminaBarBg = this.add.rectangle(180, 68, 150, 10, 0x1a2020).setScrollFactor(0);
    this.staminaBar = this.add.rectangle(105, 68, 150, 10, this.palette.stamina).setOrigin(0, 0.5).setScrollFactor(0);

    this.statusText = this.add.text(camera.width - 20, 30, "Santuario en ruinas", {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#c9b58a"
    })
      .setOrigin(1, 0)
      .setScrollFactor(0);
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemy, this.platforms);

    this.physics.add.overlap(this.attackHitbox, this.enemy, () => {
      const now = this.time.now;
      if (!this.attackHitbox.active || now < this.enemyState.hitCooldownUntil || this.enemyState.health <= 0) {
        return;
      }

      this.enemyState.health -= 1;
      this.enemyState.hitCooldownUntil = now + 250;
      this.enemy.setTintFill(0xffe0d1);
      this.time.delayedCall(120, () => this.enemy.clearTint());
      this.enemy.setVelocityX(170 * this.playerState.facing);

      if (this.enemyState.health <= 0) {
        this.enemy.disableBody(true, true);
        this.enemyEye.setVisible(false);
        this.statusText.setText("Bestia derrotada");
      }
    });

    this.physics.add.overlap(this.player, this.enemy, () => {
      const now = this.time.now;
      if (this.enemyState.health <= 0 || now < this.playerState.invulnerableUntil || this.isDodging) {
        return;
      }

      this.playerState.health = Math.max(0, this.playerState.health - 1);
      this.playerState.invulnerableUntil = now + 1100;
      this.player.setTintFill(0xffb6a9);
      this.cameras.main.shake(120, 0.01);
      this.player.setVelocityY(-220);
      this.player.setVelocityX(-180 * this.enemyState.direction);
      this.time.delayedCall(180, () => this.player.clearTint());

      if (this.playerState.health <= 0) {
        this.scene.restart();
      }
    });
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, 32);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      jumpAlt: Phaser.Input.Keyboard.KeyCodes.W,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      dodge: Phaser.Input.Keyboard.KeyCodes.K,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
  }

  updateMovement() {
    const onFloor = this.player.body.blocked.down;
    const moveLeft = this.keys.left.isDown || this.keys.a.isDown;
    const moveRight = this.keys.right.isDown || this.keys.d.isDown;
    const wantsJump = Phaser.Input.Keyboard.JustDown(this.keys.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.jumpAlt)
      || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (!this.isDodging) {
      if (moveLeft) {
        this.player.setVelocityX(-155);
        this.playerState.facing = -1;
      } else if (moveRight) {
        this.player.setVelocityX(155);
        this.playerState.facing = 1;
      }
    }

    if (!moveLeft && !moveRight && !this.isDodging && !this.isAttacking) {
      this.player.setVelocityX(this.player.body.velocity.x * 0.82);
    }

    if (wantsJump && onFloor && this.playerState.stamina >= 8) {
      this.player.setVelocityY(-355);
      this.playerState.stamina = Math.max(0, this.playerState.stamina - 8);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      this.tryAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.dodge)) {
      this.tryDodge();
    }

    this.player.setFlipX(this.playerState.facing < 0);

    this.playerCape.setPosition(
      this.player.x - this.playerState.facing * 6,
      this.player.y - 6
    );
    this.playerCape.setFlipX(this.playerState.facing < 0);
    this.playerCape.rotation = Phaser.Math.Clamp(this.player.body.velocity.x * 0.0025, -0.22, 0.22);

    if (!this.isDodging && this.playerState.stamina < 100) {
      this.playerState.stamina = Math.min(100, this.playerState.stamina + 0.14);
    }
  }

  tryAttack() {
    const now = this.time.now;
    if (this.isAttacking || this.isDodging || now - this.lastAttackTime < 320 || this.playerState.stamina < 12) {
      return;
    }

    this.lastAttackTime = now;
    this.isAttacking = true;
    this.playerState.stamina = Math.max(0, this.playerState.stamina - 12);
    this.player.setVelocityX(this.playerState.facing * 70);

    this.attackHitbox.setPosition(this.player.x + this.playerState.facing * 28, this.player.y - 18);
    this.attackHitbox.setVisible(true);
    this.attackHitbox.active = true;
    this.attackHitbox.body.enable = true;
    this.attackHitbox.setFlipX(this.playerState.facing < 0);
    this.attackHitbox.setAlpha(0.65);
    this.tweens.add({
      targets: this.attackHitbox,
      alpha: 0,
      duration: 140,
      yoyo: false
    });
  }

  updateAttackWindow(time) {
    if (!this.isAttacking) {
      return;
    }

    this.attackHitbox.setPosition(this.player.x + this.playerState.facing * 28, this.player.y - 18);

    if (time - this.lastAttackTime > 150) {
      this.isAttacking = false;
      this.attackHitbox.setVisible(false);
      this.attackHitbox.active = false;
      this.attackHitbox.body.enable = false;
      this.attackHitbox.setAlpha(0.65);
    }
  }

  tryDodge() {
    const now = this.time.now;
    if (this.isDodging || this.isAttacking || now - this.lastDodgeTime < 650 || this.playerState.stamina < 18) {
      return;
    }

    this.lastDodgeTime = now;
    this.isDodging = true;
    this.playerState.stamina = Math.max(0, this.playerState.stamina - 18);
    this.playerState.invulnerableUntil = now + 320;
    this.player.setVelocityX(this.playerState.facing * 310);
    this.player.setTint(0xd8d2c2);
  }

  updateDodgeWindow(time) {
    if (!this.isDodging) {
      return;
    }

    if (time - this.lastDodgeTime > 210) {
      this.isDodging = false;
      this.player.clearTint();
    }
  }

  updateEnemyBehavior(time) {
    if (!this.enemy.body || this.enemyState.health <= 0) {
      return;
    }

    const distance = this.player.x - this.enemy.x;
    const absDistance = Math.abs(distance);

    if (absDistance < this.enemyState.awakeDistance) {
      this.enemyState.direction = distance > 0 ? 1 : -1;
      this.enemy.setVelocityX(this.enemyState.direction * this.enemyState.speed);
    } else {
      this.enemy.setVelocityX(Math.sin(time * 0.0012) * 28);
    }

    this.enemy.setFlipX(this.enemy.body.velocity.x > 0);
    this.enemyEye.setPosition(this.enemy.x + (this.enemy.flipX ? 4 : -4), this.enemy.y - 22);
  }

  updateHud() {
    this.healthBar.width = 150 * (this.playerState.health / 5);
    this.staminaBar.width = 150 * (this.playerState.stamina / 100);
  }

  updateAtmosphere() {
    this.mistGroup.getChildren().forEach((mist, index) => {
      mist.x += 0.08 + index * 0.01;
      if (mist.x > LEVEL_WIDTH + 120) {
        mist.x = -120;
      }
    });

    this.torchLights.forEach((light, index) => {
      light.alpha = 0.08 + Math.sin(this.time.now * 0.006 + index) * 0.04;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: "#09080f",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 780 },
      debug: false
    }
  },
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
