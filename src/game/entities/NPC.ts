import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  entityRef: string;
  displayName: string;

  private idleTimer = 0;
  private facing: 'down' | 'left' | 'right' | 'up' = 'down';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    entityRef: string,
    displayName: string,
  ) {
    this.entityRef = entityRef;
    this.displayName = displayName;

    this.sprite = scene.physics.add.sprite(x, y, textureKey, 0);
    const margin = Math.round(TILE_SIZE * 0.25);
    this.sprite.setSize(TILE_SIZE - margin, TILE_SIZE - margin);
    this.sprite.setOffset(margin / 2, margin / 2);
    this.sprite.setImmovable(true);
    this.sprite.setDepth(y);

    // Store reference on the sprite for collision callbacks
    this.sprite.setData('npc', this);
  }

  update(_time: number) {
    // Simple idle behavior: occasionally turn to face a random direction
    this.idleTimer -= 16; // ~60fps
    if (this.idleTimer <= 0) {
      this.idleTimer = 2000 + Math.random() * 3000;
      const dirs: ('down' | 'left' | 'right' | 'up')[] = ['down', 'left', 'right', 'up'];
      this.facing = dirs[Math.floor(Math.random() * dirs.length)];
      this.updateFrame();
    }

    this.sprite.setDepth(this.sprite.y);
  }

  facePlayer(playerX: number, playerY: number) {
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'left' : 'right';
    } else {
      this.facing = dy > 0 ? 'up' : 'down';
    }
    this.updateFrame();
  }

  private updateFrame() {
    const frameMap = { down: 0, left: 1, right: 2, up: 3 };
    this.sprite.setFrame(frameMap[this.facing]);
  }
}
