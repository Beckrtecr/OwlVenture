class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Health Bar
        this.add.text(20, 20, 'HP', { fontSize: '16px', fill: '#fff' });
        this.healthBar = this.add.rectangle(50, 28, 200, 16, 0x4caf50).setOrigin(0, 0.5);
        this.healthBarBg = this.add.rectangle(50, 28, 200, 16, 0x000000).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff);
        this.healthBar.setDepth(1);
        this.healthBarBg.setDepth(0);

        // Stamina Bar
        this.add.text(20, 50, 'STM', { fontSize: '16px', fill: '#fff' });
        this.staminaBar = this.add.rectangle(60, 58, 150, 10, 0xffd700).setOrigin(0, 0.5);
        this.staminaBarBg = this.add.rectangle(60, 58, 150, 10, 0x000000).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff);
        this.staminaBar.setDepth(1);
        this.staminaBarBg.setDepth(0);

        // Minimap Frame
        const mapSize = 150;
        this.minimapBg = this.add.rectangle(this.cameras.main.width - mapSize - 20, 20, mapSize, mapSize, 0x000000, 0.5).setOrigin(0, 0).setStrokeStyle(2, 0xffffff);
        this.add.text(this.cameras.main.width - mapSize - 20, 120, 'MINIMAP', { fontSize: '10px', fill: '#aaa' }).setOrigin(0, 0);

        // Listen for events from GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateUI', this.updateStats, this);
    }

    updateStats(data) {
        // Update Health
        const hpPercent = Phaser.Math.Clamp(data.hp / data.maxHp, 0, 1);
        this.healthBar.width = 200 * hpPercent;

        // Update Stamina
        const stmPercent = Phaser.Math.Clamp(data.stamina / data.maxStamina, 0, 1);
        this.staminaBar.width = 150 * stmPercent;
    }
}
