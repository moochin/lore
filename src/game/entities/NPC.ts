import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';

const WANDER_SPEED = TILE_SIZE * (40 / 16); // 40% of player speed
const WANDER_RADIUS = TILE_SIZE * 2.5;
const EMOTE_KEYS: Record<string, string> = {
  service: 'emote_hammer',
  library: 'emote_book',
  api: 'emote_scroll',
  website: 'emote_crystal',
  default: 'emote_thought',
};

type WanderState = 'idle' | 'walking' | 'pausing';

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  entityRef: string;
  displayName: string;
  playerNearby = false;

  private scene: Phaser.Scene;
  private facing: 'down' | 'left' | 'right' | 'up' = 'down';
  private textureKey: string;

  // Wandering
  private wander: boolean;
  private homeX: number;
  private homeY: number;
  private wanderState: WanderState = 'idle';
  private wanderTarget: { x: number; y: number } | null = null;
  private stateTimer = 0;
  private pausedByPlayer = false;
  private pauseResumeTimer = 0;

  // Emotes
  private entityKind: string;
  private emoteSprite: Phaser.GameObjects.Image | null = null;
  private emoteTimer: number;
  private emoteVisible = false;
  private emoteTween: Phaser.Tweens.Tween | null = null;
  private lastPlayerNearby = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    entityRef: string,
    displayName: string,
    wander = false,
    entityKind = 'default',
  ) {
    this.scene = scene;
    this.entityRef = entityRef;
    this.displayName = displayName;
    this.textureKey = textureKey;
    this.wander = wander;
    this.entityKind = entityKind;
    this.homeX = x;
    this.homeY = y;

    this.sprite = scene.physics.add.sprite(x, y, textureKey, 0);
    const margin = Math.round(TILE_SIZE * 0.25);
    this.sprite.setSize(TILE_SIZE - margin, TILE_SIZE - margin);
    this.sprite.setOffset(margin / 2, margin / 2);
    this.sprite.setImmovable(true);
    this.sprite.setDepth(y);

    // Store reference on the sprite for collision callbacks
    this.sprite.setData('npc', this);

    if (wander) {
      this.createAnimations();
      this.stateTimer = 2000 + Math.random() * 3000;
    } else {
      this.stateTimer = 2000 + Math.random() * 3000;
    }

    // Emote timer — stagger initial delay
    this.emoteTimer = 5000 + Math.random() * 10000;
  }

  private createAnimations() {
    const anims = this.scene.anims;
    const key = this.textureKey;

    if (!anims.exists(`${key}_down`)) {
      anims.create({
        key: `${key}_down`,
        frames: [{ key, frame: 0 }, { key, frame: 1 }, { key, frame: 0 }, { key, frame: 2 }],
        frameRate: 6,
        repeat: -1,
      });
      anims.create({
        key: `${key}_left`,
        frames: [{ key, frame: 3 }, { key, frame: 4 }, { key, frame: 3 }, { key, frame: 5 }],
        frameRate: 6,
        repeat: -1,
      });
      anims.create({
        key: `${key}_right`,
        frames: [{ key, frame: 6 }, { key, frame: 7 }, { key, frame: 6 }, { key, frame: 8 }],
        frameRate: 6,
        repeat: -1,
      });
      anims.create({
        key: `${key}_up`,
        frames: [{ key, frame: 9 }, { key, frame: 10 }, { key, frame: 9 }, { key, frame: 11 }],
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  update(_time: number) {
    const dt = 16; // ~60fps

    if (this.wander) {
      this.updateWander(dt);
    } else {
      this.updateIdle(dt);
    }

    this.updateEmote(dt);
    this.sprite.setDepth(this.sprite.y);
  }

  private updateIdle(dt: number) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.stateTimer = 2000 + Math.random() * 3000;
      const dirs: ('down' | 'left' | 'right' | 'up')[] = ['down', 'left', 'right', 'up'];
      this.facing = dirs[Math.floor(Math.random() * dirs.length)];
      this.updateFrame();
    }
  }

  private updateWander(dt: number) {
    // If paused by player interaction, count down before resuming
    if (this.pausedByPlayer) {
      this.pauseResumeTimer -= dt;
      if (this.pauseResumeTimer <= 0) {
        this.pausedByPlayer = false;
        this.wanderState = 'idle';
        this.stateTimer = 1000 + Math.random() * 2000;
      }
      this.sprite.setVelocity(0, 0);
      this.sprite.anims.stop();
      return;
    }

    switch (this.wanderState) {
      case 'idle': {
        this.sprite.setVelocity(0, 0);
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // Pick a random target within wander radius of home
          const angle = Math.random() * Math.PI * 2;
          const dist = TILE_SIZE + Math.random() * WANDER_RADIUS;
          this.wanderTarget = {
            x: this.homeX + Math.cos(angle) * dist,
            y: this.homeY + Math.sin(angle) * dist,
          };
          this.wanderState = 'walking';
        }
        break;
      }
      case 'walking': {
        if (!this.wanderTarget) {
          this.wanderState = 'idle';
          this.stateTimer = 2000 + Math.random() * 3000;
          break;
        }

        const dx = this.wanderTarget.x - this.sprite.x;
        const dy = this.wanderTarget.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
          // Arrived at target
          this.sprite.setVelocity(0, 0);
          this.sprite.anims.stop();
          this.updateFrame();
          this.wanderState = 'pausing';
          this.stateTimer = 2000 + Math.random() * 2000;
          this.wanderTarget = null;
          break;
        }

        // Move toward target
        const vx = (dx / dist) * WANDER_SPEED;
        const vy = (dy / dist) * WANDER_SPEED;
        this.sprite.setVelocity(vx, vy);

        // Update facing and play walk animation
        if (Math.abs(dx) > Math.abs(dy)) {
          this.facing = dx > 0 ? 'right' : 'left';
        } else {
          this.facing = dy > 0 ? 'down' : 'up';
        }
        this.sprite.anims.play(`${this.textureKey}_${this.facing}`, true);
        break;
      }
      case 'pausing': {
        this.sprite.setVelocity(0, 0);
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.wanderState = 'idle';
          this.stateTimer = 3000 + Math.random() * 3000;
        }
        break;
      }
    }
  }

  private updateEmote(dt: number) {
    // Player proximity "!" emote
    if (this.playerNearby && !this.lastPlayerNearby) {
      this.showEmote('emote_exclaim');
    } else if (!this.playerNearby && this.lastPlayerNearby) {
      this.hideEmote();
    }
    this.lastPlayerNearby = this.playerNearby;

    // Idle emote timer (only when player is not nearby)
    if (!this.playerNearby) {
      this.emoteTimer -= dt;
      if (this.emoteTimer <= 0) {
        this.emoteTimer = 8000 + Math.random() * 7000;
        // 70% kind-specific, 30% generic thought
        const emoteKey = Math.random() < 0.7
          ? (EMOTE_KEYS[this.entityKind] ?? 'emote_thought')
          : 'emote_thought';
        this.showEmote(emoteKey);
        // Auto-hide after 2.5s
        this.scene.time.delayedCall(2500, () => {
          if (!this.playerNearby) {
            this.hideEmote();
          }
        });
      }
    }

    // Keep emote positioned above NPC
    if (this.emoteSprite && this.emoteVisible) {
      this.emoteSprite.setPosition(this.sprite.x, this.sprite.y - TILE_SIZE);
      this.emoteSprite.setDepth(this.sprite.y + 1000);
    }
  }

  private showEmote(key: string) {
    if (this.emoteSprite) {
      this.emoteSprite.setTexture(key);
      this.emoteSprite.setVisible(true);
    } else {
      this.emoteSprite = this.scene.add.image(
        this.sprite.x,
        this.sprite.y - TILE_SIZE,
        key,
      );
      this.emoteSprite.setDepth(this.sprite.y + 1000);
    }
    this.emoteVisible = true;

    // Float tween
    if (this.emoteTween) this.emoteTween.destroy();
    this.emoteSprite.setPosition(this.sprite.x, this.sprite.y - TILE_SIZE);
    this.emoteTween = this.scene.tweens.add({
      targets: this.emoteSprite,
      y: this.sprite.y - TILE_SIZE - 3,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private hideEmote() {
    if (this.emoteSprite) {
      this.emoteSprite.setVisible(false);
      if (this.emoteTween) {
        this.emoteTween.destroy();
        this.emoteTween = null;
      }
    }
    this.emoteVisible = false;
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

    // Pause wandering temporarily
    if (this.wander) {
      this.pausedByPlayer = true;
      this.pauseResumeTimer = 3000;
      this.sprite.setVelocity(0, 0);
      this.sprite.anims.stop();
    }
  }

  private updateFrame() {
    const frameMap = { down: 0, left: 3, right: 6, up: 9 };
    this.sprite.setFrame(frameMap[this.facing]);
  }
}
