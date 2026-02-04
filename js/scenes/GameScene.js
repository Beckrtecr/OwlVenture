class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // World Bounds
        this.mapWidth = 3200;
        this.mapHeight = 3200;
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        // --- LAYER 1: Parallax Background ---
        this.bgDeep = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'water')
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // --- LAYER 2: The World (Ground) ---
        this.groundGroup = this.add.group();
        this.generateWorld();

        // --- LAYER 3: Objects (Trees, Enemies, Player) ---

        // Player Setup
        this.player = this.physics.add.sprite(400, 300, 'owl');
        this.player.setCollideWorldBounds(true);
        this.player.zHeight = 0; // Custom Z altitude
        this.player.zVelocity = 0;
        this.player.isFlying = false;
        // Default cloth color (white tint means normal)
        this.player.setTint(0xffffff);

        // Player Shadow
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
            fly: Phaser.Input.Keyboard.KeyCodes.SPACE,
            inventory: Phaser.Input.Keyboard.KeyCodes.E
        });

        // Enemies
        this.enemies = this.physics.add.group();
        this.spawnEnemies();

        // Projectiles
        this.projectiles = this.physics.add.group();
        this.input.on('pointerdown', (pointer) => {
            if (!this.inventoryVisible) {
                this.shoot(pointer);
            }
        });

        // Clouds
        this.clouds = this.add.group();
        this.createClouds(20);

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
        this.physics.add.collider(this.player, this.trees);

        // Inventory UI
        this.createInventory();
    }

    generateWorld() {
        // More detailed procedural generation
        // Base grass everywhere
        for (let x = 0; x < this.mapWidth; x += 32) {
            for (let y = 0; y < this.mapHeight; y += 32) {
                this.add.image(x, y, 'grass').setOrigin(0);
            }
        }

        // Generate features: Forests, Dirt Patches, Lakes
        this.trees = this.physics.add.staticGroup();

        // Perlin-ish noise simulation for biomes (simple clustering)
        const gridSize = 100; // chunks
        for (let x = 0; x < this.mapWidth; x += gridSize) {
            for (let y = 0; y < this.mapHeight; y += gridSize) {
                const rand = Math.random();

                // 10% Chance of Water Lake
                if (rand < 0.1) {
                    this.createLake(x, y);
                }
                // 30% Chance of Dense Forest
                else if (rand < 0.4) {
                    this.createForest(x, y);
                }
                // 10% Chance of Dirt Patch
                else if (rand < 0.5) {
                    this.createDirtPatch(x, y);
                }
                // Scattered trees elsewhere
                else if (Math.random() < 0.3) {
                    const tree = this.trees.create(x + Phaser.Math.Between(0, 50), y + Phaser.Math.Between(0, 50), 'tree');
                    tree.setDepth(tree.y);
                }
            }
        }
    }

    createLake(startX, startY) {
        // Blobs of water
        for (let i = 0; i < 5; i++) {
            // Just visual water tiles on top of grass
            const wx = startX + Phaser.Math.Between(-50, 50);
            const wy = startY + Phaser.Math.Between(-50, 50);
            this.add.image(wx, wy, 'water').setOrigin(0).setDepth(1);
        }
    }

    createForest(startX, startY) {
        for (let i = 0; i < 8; i++) {
            const tx = startX + Phaser.Math.Between(0, 100);
            const ty = startY + Phaser.Math.Between(0, 100);
            const tree = this.trees.create(tx, ty, 'tree');
            tree.setDepth(ty);
            tree.refreshBody();
        }
    }

    createDirtPatch(startX, startY) {
        for (let i = 0; i < 5; i++) {
            const dx = startX + Phaser.Math.Between(0, 80);
            const dy = startY + Phaser.Math.Between(0, 80);
            this.add.image(dx, dy, 'dirt').setOrigin(0);
        }
    }

    createClouds(count) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(0, this.mapWidth);
            const y = Phaser.Math.Between(0, this.mapHeight);
            const cloud = this.add.image(x, y, 'water').setScale(3).setAlpha(0.3);
            cloud.setScrollFactor(1.2);
            cloud.setDepth(9999);
            this.clouds.add(cloud);
        }
    }

    spawnEnemies() {
        // 5 Types: Red, Blue, Green, White, Gold
        // Hierarchy: Red < Blue < Green < White < Gold
        const enemyTypes = [
            { key: 'goblin_red', hp: 20, speed: 30, damage: 5, color: 0xff0000, count: 15 },
            { key: 'goblin_blue', hp: 40, speed: 45, damage: 10, color: 0x0000ff, count: 10 },
            { key: 'goblin_green', hp: 60, speed: 60, damage: 15, color: 0x00ff00, count: 8 },
            { key: 'goblin_white', hp: 100, speed: 80, damage: 20, color: 0xffffff, count: 5 },
            { key: 'goblin_gold', hp: 200, speed: 100, damage: 50, color: 0xffd700, count: 2 } // Rare bosses
        ];

        enemyTypes.forEach(type => {
            for (let i = 0; i < type.count; i++) {
                const x = Phaser.Math.Between(100, this.mapWidth);
                const y = Phaser.Math.Between(100, this.mapHeight);
                const enemy = this.enemies.create(x, y, type.key); // Using generated texture keys
                enemy.setBounce(1);
                enemy.setCollideWorldBounds(true);
                enemy.setVelocity(Phaser.Math.Between(-type.speed, type.speed), Phaser.Math.Between(-type.speed, type.speed));

                // Store stats on the object
                enemy.stats = { ...type };
                enemy.currentHp = type.hp;
            }
        });
    }

    createInventory() {
        this.inventoryVisible = false;
        this.inventoryContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(20000).setVisible(false);

        // Background
        const bg = this.add.rectangle(400, 300, 600, 400, 0x222222, 0.9).setStrokeStyle(4, 0x888888);
        const title = this.add.text(400, 150, 'INVENTORY', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

        // Cloth Slots (Change colors)
        const instructions = this.add.text(400, 200, 'Equip Cloth Color', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);

        const colors = [0xffffff, 0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0x00ffff, 0xff00ff];
        let startX = 200;

        colors.forEach((color, index) => {
            const slotContainer = this.add.container(startX + (index * 60), 250);
            const slotBg = this.add.rectangle(0, 0, 40, 40, 0x444444).setInteractive();
            const colorSwatch = this.add.rectangle(0, 0, 30, 30, color);

            slotBg.on('pointerdown', () => {
                this.player.setTint(color);
                this.add.text(400, 350, 'Equipped!', { fontSize: '20px', color: '#ffff00' })
                    .setOrigin(0.5)
                    .setAlpha(1)
                    .setDepth(20001);
            });

            slotContainer.add([slotBg, colorSwatch]);
            this.inventoryContainer.add(slotContainer);
        });

        // Add Armor/Weapon placeholders (just text for now as requested "equip weapons, put on armor")
        const weaponText = this.add.text(400, 320, 'Weapons: Talon Sword (Equipped)', { fontSize: '16px' }).setOrigin(0.5);
        const armorText = this.add.text(400, 350, 'Armor: Feathers (Equipped)', { fontSize: '16px' }).setOrigin(0.5);

        this.inventoryContainer.add([bg, title, instructions, weaponText, armorText]);
    }

    update() {
        // Toggle Inventory
        if (Phaser.Input.Keyboard.JustDown(this.wasd.inventory)) {
            this.inventoryVisible = !this.inventoryVisible;
            this.inventoryContainer.setVisible(this.inventoryVisible);
        }

        // If inventory is open, pause movement
        if (this.inventoryVisible) return;

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

        // Fly
        if (Phaser.Input.Keyboard.JustDown(this.wasd.fly)) {
            this.player.zVelocity = 5;
            this.player.isFlying = true;
        }

        // Apply "Gravity" to Z
        if (this.player.isFlying) {
            this.player.zHeight += this.player.zVelocity;
            this.player.zVelocity -= 0.2; // Gravity
            if (this.player.zHeight <= 0) {
                this.player.zHeight = 0;
                this.player.zVelocity = 0;
                this.player.isFlying = false;
            }
        }

        // Shadows & Scale
        this.playerShadow.x = this.player.x;
        this.playerShadow.y = this.player.y + 16;
        this.playerShadow.setScale(1 - (this.player.zHeight / 100));
        this.player.setScale(1 + (this.player.zHeight / 50));

        // Depth Sorting
        if (this.player.zHeight > 20) {
            this.player.setDepth(9999);
        } else {
            this.player.setDepth(this.player.y);
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.setDepth(enemy.y);
            // Chase AI
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 300) {
                this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
            }
        });

        // Update Clouds
        this.clouds.getChildren().forEach(cloud => {
            cloud.x += 0.5;
            if (cloud.x > this.mapWidth) cloud.x = -100;
        });

        this.events.emit('updateUI', this.playerStats);
    }

    shoot(pointer) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        const proj = this.projectiles.create(this.player.x, this.player.y, 'projectile');
        proj.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
        proj.rotation = angle;
        this.time.delayedCall(2000, () => proj.destroy());
    }

    hitEnemy(player, enemy) {
        // Take damage
        if (!this.player.isFlying || this.player.zHeight < 10) { // Can fly over enemies
            this.cameras.main.shake(100, 0.01);
            this.playerStats.hp -= enemy.stats.damage;

            // Knockback
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);

            if (this.playerStats.hp <= 0) {
                this.scene.restart();
            }
        }
    }

    hitEnemyProjectile(projectile, enemy) {
        projectile.destroy();
        enemy.currentHp -= 10; // Player damage
        enemy.setTint(0xffffff); // Flash white
        this.time.delayedCall(50, () => enemy.clearTint()); // Reset tint

        // Create random blink effect
        this.add.image(enemy.x, enemy.y, 'slash').setDepth(9999).play('attack').destroy(); // If we had anim, just show sprite
        const slash = this.add.image(enemy.x, enemy.y, 'slash');
        this.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 200,
            onComplete: () => slash.destroy()
        });

        if (enemy.currentHp <= 0) {
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
