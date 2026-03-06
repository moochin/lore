import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

const SPEED = TILE_SIZE * (100 / 16);

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private interactKey: Phaser.Input.Keyboard.Key;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create sprite from generated spritesheet
    this.sprite = scene.physics.add.sprite(x, y, 'player', 0);
    const margin = Math.round(TILE_SIZE * 0.25);
    this.sprite.setSize(TILE_SIZE - margin, TILE_SIZE - margin);
    this.sprite.setOffset(margin / 2, margin / 2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(y);

    // Create animations
    this.createAnimations();

    // Input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private createAnimations() {
    const anims = this.scene.anims;

    // Only create if they don't exist yet (animations are global)
    if (!anims.exists('player_down')) {
      anims.create({
        key: 'player_down',
        frames: [{ key: 'player', frame: 0 }, { key: 'player', frame: 1 }, { key: 'player', frame: 0 }, { key: 'player', frame: 2 }],
        frameRate: 8,
        repeat: -1,
      });
      anims.create({
        key: 'player_left',
        frames: [{ key: 'player', frame: 3 }, { key: 'player', frame: 4 }, { key: 'player', frame: 3 }, { key: 'player', frame: 5 }],
        frameRate: 8,
        repeat: -1,
      });
      anims.create({
        key: 'player_right',
        frames: [{ key: 'player', frame: 6 }, { key: 'player', frame: 7 }, { key: 'player', frame: 6 }, { key: 'player', frame: 8 }],
        frameRate: 8,
        repeat: -1,
      });
      anims.create({
        key: 'player_up',
        frames: [{ key: 'player', frame: 9 }, { key: 'player', frame: 10 }, { key: 'player', frame: 9 }, { key: 'player', frame: 11 }],
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  interactPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.interactKey);
  }

  update() {
    // Check if an input/textarea has focus AND is visible in the DOM
    // (prevents checking unmounted elements from a closed modal)
    const activeElement = document.activeElement as HTMLElement | null;
    const isInputFocused =
      (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') &&
      document.body.contains(activeElement);

    const up = this.cursors.up.isDown || (!isInputFocused && this.wasd.up.isDown);
    const down = this.cursors.down.isDown || (!isInputFocused && this.wasd.down.isDown);
    const left = this.cursors.left.isDown || (!isInputFocused && this.wasd.left.isDown);
    const right = this.cursors.right.isDown || (!isInputFocused && this.wasd.right.isDown);

    let vx = 0;
    let vy = 0;

    if (left) vx = -SPEED;
    else if (right) vx = SPEED;

    if (up) vy = -SPEED;
    else if (down) vy = SPEED;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    this.sprite.setVelocity(vx, vy);

    // Animation
    if (vx < 0) {
      this.sprite.anims.play('player_left', true);
    } else if (vx > 0) {
      this.sprite.anims.play('player_right', true);
    } else if (vy < 0) {
      this.sprite.anims.play('player_up', true);
    } else if (vy > 0) {
      this.sprite.anims.play('player_down', true);
    } else {
      this.sprite.anims.stop();
    }

    // Depth sorting for proper sprite ordering
    this.sprite.setDepth(this.sprite.y);
  }
}
