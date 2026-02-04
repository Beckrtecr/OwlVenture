const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true, // Crucial for that crisp pixel look
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top down, no global gravity
            debug: false
        }
    },
    scene: [BootScene, MenuScene, UIScene, GameScene]
};

const game = new Phaser.Game(config);

// Handle resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
