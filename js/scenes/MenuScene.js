class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Pixelated Background
        // We can use a tileSprite or just a solid color with some "pixel stars"
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x1a1a2e).setOrigin(0);

        // Add some random stars/pixels for "pixel art" feel
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 0.5);
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.Between(2, 4);
            graphics.fillRect(x, y, size, size);
        }

        // Title
        const titleText = this.add.text(this.cameras.main.centerX, 150, 'OWLVENTURE', {
            fontFamily: '"Press Start 2P"', // Assuming a pixel font, or fallback
            fontSize: '48px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Buttons
        this.createButton(this.cameras.main.centerX, 300, 'New Game', () => this.startGame());
        this.createButton(this.cameras.main.centerX, 380, 'Resume', () => this.resumeGame());
        this.createButton(this.cameras.main.centerX, 460, 'How to Play', () => this.showInstructions());

        // Instructions Container (Hidden by default)
        this.createInstructionsPopup();
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        // Button Background (Pixel style)
        const bg = this.add.rectangle(0, 0, 200, 50, 0x4a4e69)
            .setStrokeStyle(4, 0x22223b);

        const label = this.add.text(0, 0, text, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(200, 50);

        // Interactive
        button.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);

        button.on('pointerover', () => {
            bg.setFillStyle(0x9a8c98);
            this.input.setDefaultCursor('pointer');
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0x4a4e69);
            this.input.setDefaultCursor('default');
        });

        button.on('pointerdown', () => {
            bg.setFillStyle(0x22223b);
        });

        button.on('pointerup', () => {
            callback();
            bg.setFillStyle(0x9a8c98);
        });
    }

    startGame() {
        // Reset game state if needed (handled in GameScene init/create usually)
        // For now, stop GameScene if it's running, then start it fresh
        if (this.scene.get('GameScene').scene.isActive()) {
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
        }
        this.scene.start('GameScene');
        this.scene.start('UIScene');
    }

    resumeGame() {
        // If GameScene exists and is sleeping or just exists, resume. 
        // If not started yet, start it.
        if (this.scene.get('GameScene').scene.isActive()) {
            this.scene.resume('GameScene');
            this.scene.switch('GameScene'); // Bring to top
        } else if (this.scene.get('GameScene').sys.settings.status > Phaser.Scenes.START) {
            // It's running but maybe paused?
            this.scene.resume('GameScene');
            this.scene.switch('GameScene');
        } else {
            // Just start
            this.startGame();
        }
    }

    showInstructions() {
        this.instructionsContainer.setVisible(true);
    }

    createInstructionsPopup() {
        this.instructionsContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);

        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9)
            .setStrokeStyle(4, 0xffffff);

        const title = this.add.text(0, -120, 'HOW TO PLAY', { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5);

        const textContent = `
        WASD / Arrows: Move
        SPACE: Fly / Dive
        SHIFT: Dash
        Click: Attack / Shoot
        E: Inventory
        `;

        const text = this.add.text(0, -20, textContent, {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 120, '[ CLOSE ]', { fontSize: '20px', color: '#ff0000' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.instructionsContainer.setVisible(false));

        this.instructionsContainer.add([bg, title, text, closeBtn]);
        this.instructionsContainer.setVisible(false);
        this.instructionsContainer.setDepth(100);
    }
}
