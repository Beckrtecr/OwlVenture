class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load the generated owl sprite
        // Assuming sprite sheet is 32x32 frames. 
        // If the AI generated valid spritesheet, we need to guess the frame dimensions. 
        // Usually 32x32 or 64x64. I'll assume 32x32 based on prompt.
        this.load.spritesheet('owl', 'assets/sprites/owl.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.createProceduralTextures();
        this.createAnimations();
        
        // Start the game
        this.scene.start('GameScene');
        this.scene.start('UIScene');
    }

    createProceduralTextures() {
        // Helper to create simple tile textures
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // 1. Grass Tile
        graphics.fillStyle(0x4caf50); // Green
        graphics.fillRect(0, 0, 32, 32);
        graphics.fillStyle(0x388e3c); // Darker grass details
        graphics.fillRect(5, 5, 4, 4);
        graphics.fillRect(20, 25, 6, 2);
        graphics.generateTexture('grass', 32, 32);
        graphics.clear();

        // 2. Water Tile
        graphics.fillStyle(0x2196f3); // Blue
        graphics.fillRect(0, 0, 32, 32);
        graphics.fillStyle(0x64b5f6); // Highlights
        graphics.fillRect(5, 10, 10, 2);
        graphics.fillRect(15, 20, 8, 2);
        graphics.generateTexture('water', 32, 32);
        graphics.clear();

        // 3. Dirt/Cliff Tile
        graphics.fillStyle(0x795548); // Brown
        graphics.fillRect(0, 0, 32, 32);
        graphics.fillStyle(0x5d4037); // Dark spots
        graphics.fillCircle(10, 10, 3);
        graphics.generateTexture('dirt', 32, 32);
        graphics.clear();

        // 4. Tree Sprite (Top down)
        graphics.fillStyle(0x1b5e20); // Dark Green Leaves
        graphics.fillCircle(16, 16, 16);
        graphics.fillStyle(0x81c784); // Lighter highlight
        graphics.fillCircle(12, 12, 6);
        graphics.generateTexture('tree', 32, 32);
        graphics.clear();

        // 5. Enemy (Slime)
        graphics.fillStyle(0x9c27b0); // Purple
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0xffffff); // Eyes
        graphics.fillCircle(12, 12, 4);
        graphics.fillCircle(20, 12, 4);
        graphics.fillStyle(0x000000); // Pupils
        graphics.fillCircle(12, 12, 1);
        graphics.fillCircle(20, 12, 1);
        graphics.generateTexture('enemy', 32, 32);
        graphics.clear();

        // 6. Projectile (Beak shot)
        graphics.fillStyle(0xffd700); // Gold
        graphics.fillTriangle(0, 0, 0, 10, 10, 5);
        graphics.generateTexture('projectile', 10, 10);
        graphics.clear();

        // 7. Sword Effect (Swipe)
        graphics.lineStyle(2, 0xffffff);
        graphics.beginPath();
        graphics.arc(16, 16, 20, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90), false);
        graphics.strokePath();
        graphics.generateTexture('slash', 32, 32);
        graphics.clear();
    }

    createAnimations() {
        // If sprite sheet loaded correctly
        if (this.textures.exists('owl')) {
            this.anims.create({
                key: 'fly',
                frames: this.anims.generateFrameNumbers('owl', { start: 0, end: 3 }), // Assuming 4 frames per row
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('owl', { start: 4, end: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'attack',
                frames: this.anims.generateFrameNumbers('owl', { start: 8, end: 11 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }
}
