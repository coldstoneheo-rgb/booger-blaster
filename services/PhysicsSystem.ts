import { Booger, GameState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_Y_OFFSET } from '../constants';

export class PhysicsSystem {
    private booger: Booger | null = null;

    // Config
    public maxRadius: number = 40;
    public minRadius: number = 10;
    public growthRate: number = 0.5; // Radius pixels per rub unit
    public maxRubStress: number = 1000; // Max accumulated rub before nosebleed
    private currentRubStress: number = 0;

    // Physics
    public gravity: number = 800; // px/s^2
    public airResistance: number = 0.5; // drag

    public createBooger(x: number, y: number): Booger {
        this.currentRubStress = 0;
        this.booger = {
            id: Math.random().toString(),
            x,
            y,
            dx: 0,
            dy: 0,
            radius: this.minRadius,
            color: '#bef264', // Lime 400
            rotation: 0
        };
        return this.booger;
    }

    public growBooger(amount: number): 'OK' | 'NOSEBLEED' {
        if (!this.booger) return 'OK';

        this.currentRubStress += amount;

        // Nosebleed check
        if (this.currentRubStress > this.maxRubStress) {
            this.booger = null;
            return 'NOSEBLEED';
        }

        // Grow
        this.booger.radius = Math.min(this.maxRadius, this.booger.radius + (amount * 0.05));

        return 'OK';
    }

    public launchBooger(velocity: { x: number; y: number }, speed: number) {
        if (!this.booger) return;

        // F = ma logic (simplified)
        // Larger booger = heavier = slower start? 
        // Or user wanted "Speed depends on flick speed".
        // Let's stick to direct flick mapping for "fun" factor first.

        this.booger.dx = velocity.x;
        this.booger.dy = velocity.y;
    }

    public update(dt: number, boogers: Booger[]) {
        // Here we can update all flying boogers (physics step)
        // This moves logic out of GameCanvas
        for (let i = boogers.length - 1; i >= 0; i--) {
            const b = boogers[i];

            // Apply Gravity
            b.dy += this.gravity * dt;

            // Move
            b.x += b.dx * dt;
            b.y += b.dy * dt;

            // Rotate
            b.rotation += 10 * dt;

            // Boundary checks (remove if off screen)
            if (b.y > CANVAS_HEIGHT + 50 || b.x < -100 || b.x > CANVAS_WIDTH + 100) {
                // Remove
                // Note: Arrays should be managed by the owner (GameCanvas), 
                // but for this system we might return a list of 'dead' IDs or direct splice if we pass ref.
                // React state is immutable so we shouldn't mutate 'boogers' directly if it's state.
                // BUT GameCanvas uses refs for the game loop (mutable).
            }
        }
    }

    public getBooger(): Booger | null {
        return this.booger;
    }

    public clear() {
        this.booger = null;
        this.currentRubStress = 0;
    }
}
