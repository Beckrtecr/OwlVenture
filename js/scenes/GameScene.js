class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // World Bounds
        this.mapWidth = 3200;
        this.mapHeight = 3200;
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        // --- LAYER 1: Parallax Background (The "Deep" bottom) ---
        // We create a tileSprite that covers the camera view and scrolls slowly
        this.bgDeep = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'water')
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // --- LAYER 2: The World (Ground) ---
        // Using a group for ground tiles for simply generating a world
        this.groundGroup = this.add.group();
        this.generateWorld();

        // --- LAYER 3: Objects (Trees, Enemies, Player) ---
        // We use depth sorting for 3D effect

        // Player Setup
        this.player = this.physics.add.sprite(400, 300, 'owl');
        this.player.setCollideWorldBounds(true);
        this.player.zHeight = 0; // Custom Z altitude
        this.player.zVelocity = 0;
        this.player.isFlying = false;

        // Player Shadow (for depth reference)
        this.playerShadow = this.add.ellipse(400, 300, 20, 10, 0x000000, 0.5);

        // Camera Follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.setZoom(1.5);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            fly: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Enemies
        this.enemies = this.physics.add.group();
        this.spawnEnemies(20);

        // Projectiles
        this.projectiles = this.physics.add.group();
        this.input.on('pointerdown', (pointer) => {
            this.shoot(pointer);
        });

        // Clouds (Parallax High Layer)
        this.clouds = this.add.group();
        this.createClouds(15);

        // UI Data
        this.playerStats = {
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100
        };

        // Collisions
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemyProjectile, null, this);
    }

    generateWorld() {
        // Simple procedural generation
        // Fill base with grass
        for (let x = 0; x < this.mapWidth; x += 32) {
            for (let y = 0; y < this.mapHeight; y += 32) {
                // Randomly choose texture variants if we had them, defaulting to grass
                if (Math.random() < 0.1) {
                    this.add.image(x, y, 'dirt').setOrigin(0);
                } else {
                    this.add.image(x, y, 'grass').setOrigin(0);
                }
            }
        }

        // Add Trees as obstacles
        this.trees = this.physics.add.staticGroup();
        for (let i = 0; i < 300; i++) {
            const x = Phaser.Math.Between(0, this.mapWidth);
            const y = Phaser.Math.Between(0, this.mapHeight);
            const tree = this.trees.create(x, y, 'tree');
            tree.setDepth(y); // Basic depth sort based on Y
            tree.refreshBody();
        }

        this.physics.add.collider(this.player, this.trees);
    }

    createClouds(count) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(0, this.mapWidth);
            const y = Phaser.Math.Between(0, this.mapHeight);
            // Using 'water' as simpler cloud placeholder, tint it white/grey
            const cloud = this.add.image(x, y, 'water').setScale(3).setAlpha(0.3);
            cloud.setScrollFactor(1.2); // Moves faster = closer
            cloud.setDepth(9999); // Always on top
            this.clouds.add(cloud);
        }
    }

    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(100, this.mapWidth);
            const y = Phaser.Math.Between(100, this.mapHeight);
            const enemy = this.enemies.create(x, y, 'enemy');
            enemy.setBounce(1);
            enemy.setCollideWorldBounds(true);
            enemy.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
            enemy.hp = 3;
        }
    }

    update() {
        // Player Movement
        const speed = 160;
        const speedMult = this.wasd.dash.isDown ? 2 : 1;

        this.player.setVelocity(0);

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed * speedMult);
            this.player.flipX = true;
            this.player.anims.play('fly', true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed * speedMult);
            this.player.flipX = false;
            this.player.anims.play('fly', true);
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed * speedMult);
            this.player.anims.play('fly', true);
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed * speedMult);
            this.player.anims.play('fly', true);
        }

        if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
            this.player.anims.play('idle', true);
        }

        // Fake Z-Axis / Flight Logic
        if (Phaser.Input.Keyboard.JustDown(this.wasd.fly)) {
            // Flap wings, gain height
            this.player.zVelocity = 5;
            this.player.isFlying = true;
        }

        // Apply "Gravity" to Z
        if (this.player.isFlying) {
            this.player.zHeight += this.player.zVelocity;
            this.player.zVelocity -= 0.2; // Gravity

            // Landing
            if (this.player.zHeight <= 0) {
                this.player.zHeight = 0;
                this.player.zVelocity = 0;
                this.player.isFlying = false;
            }
        }

        // Visual Update for Z-Axis
        // The shadow stays on the ground (y), the sprite floats up (y - z)
        this.playerShadow.x = this.player.x;
        this.playerShadow.y = this.player.y + 16; // Offset to feet
        this.playerShadow.setScale(1 - (this.player.zHeight / 100)); // Shadow shrinks as you fly higher

        // Sprite Offset: We actually move the sprite body for physics, but visually we might want to offset
        // However, in top-down, usually Y is Y. 
        // To make it look like flight, we can offset the display origin or use a container.
        // Simple hack: Just move the sprite up by zHeight visually?
        // No, that messes up physics. 
        // Better: Physics Body stays on ground (shadow position). Sprite is a separate object or we just adjust loop.
        // For this simple demo: We will just scale the player up slightly to simulate "closer to camera" when high
        // and add a Y offset to the texture rendering if possible, but pure sprite offset is easier.
        // Let's just offset the Y position of the sprite relative to the body?
        // Phaser physics body offset is static.
        // Let's just do: Visual Sprite is separate from Physics Body?
        // Or simpler: The player IS the shadow collision box. The OWL is a child image.

        // For now, let's just make the sprite bigger when flying to simulate 3D pop
        const scaleBase = 1;
        this.player.setScale(scaleBase + (this.player.zHeight / 50));

        // Depth Sorting
        // Objects lower on screen (higher Y) are in front
        // Unless we are flying high, then we are above everything.
        if (this.player.zHeight > 20) {
            this.player.setDepth(9999);
        } else {
            this.player.setDepth(this.player.y);
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.setDepth(enemy.y);
            // Simple chase AI
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 200) {
                this.physics.moveToObject(enemy, this.player, 50);
            }
        });

        // Update Clouds (Parallax)
        this.clouds.getChildren().forEach(cloud => {
            cloud.x += 0.5;
            if (cloud.x > this.mapWidth) cloud.x = -100;
        });

        // Update UI
        this.events.emit('updateUI', this.playerStats);
    }

    shoot(pointer) {
        // Calculate velocity vector
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        const proj = this.projectiles.create(this.player.x, this.player.y, 'projectile');
        proj.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
        proj.rotation = angle;
        // Destroy after 2 seconds
        this.time.delayedCall(2000, () => proj.destroy());
    }

    hitEnemy(player, enemy) {
        // Take damage
        this.cameras.main.shake(100, 0.01);
        this.playerStats.hp -= 10;
        enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100)); // Knockback
        if (this.playerStats.hp <= 0) {
            this.scene.restart(); // Simple respawn
        }
    }

    hitEnemyProjectile(projectile, enemy) {
        projectile.destroy();
        enemy.hp--;
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => enemy.clearTint());

        if (enemy.hp <= 0) {
            // Particle explosion (simple)
            this.createExplosion(enemy.x, enemy.y);
            enemy.destroy();
        }
    }

    createExplosion(x, y) {
        const particles = this.add.particles(x, y, 'projectile', {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500
        });
        this.time.delayedCall(500, () => particles.destroy());
    }
}
