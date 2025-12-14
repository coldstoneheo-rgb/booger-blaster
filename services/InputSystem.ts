export type InputState = 'IDLE' | 'RUBBING' | 'FLICKING';

export interface DragInfo {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startTime: number;
    history: { x: number; y: number; time: number }[];
}

export class InputSystem {
    private state: InputState = 'IDLE';
    private dragInfo: DragInfo | null = null;
    
    // Configurable parameters (as requested)
    public rubSensitivity: number = 5.0; // Distance to count as movement
    public flickThreshold: number = 300; // Pixels per second to count as flick
    public flickTimeThreshold: number = 200; // Max ms for a flick

    private accumulatedRubDistance: number = 0;
    
    // Callbacks
    private onRub: (distance: number) => void;
    private onFlick: (velocity: { x: number; y: number }, speed: number) => void;
    private onRelease: () => void;

    constructor(
        onRub: (distance: number) => void,
        onFlick: (velocity: { x: number; y: number }, speed: number) => void,
        onRelease: () => void
    ) {
        this.onRub = onRub;
        this.onFlick = onFlick;
        this.onRelease = onRelease;
    }

    public startDrag(x: number, y: number) {
        this.state = 'RUBBING';
        this.accumulatedRubDistance = 0;
        this.dragInfo = {
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            startTime: performance.now(),
            history: [{ x, y, time: performance.now() }]
        };
    }

    public updateDrag(x: number, y: number) {
        if (this.state !== 'RUBBING' || !this.dragInfo) return;

        const lastPos = this.dragInfo.currentX;
        const lastY = this.dragInfo.currentY;
        
        // Update current
        this.dragInfo.currentX = x;
        this.dragInfo.currentY = y;
        this.dragInfo.history.push({ x, y, time: performance.now() });

        // Keep history short (last 300ms) for flick calculation
        const now = performance.now();
        this.dragInfo.history = this.dragInfo.history.filter(h => now - h.time < 300);

        // Detect Rubbing (Accumulate distance)
        const dx = x - lastPos;
        const dy = y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.accumulatedRubDistance += dist;
            // Notify Rub event
            this.onRub(dist);
        }
    }

    public endDrag(x: number, y: number) {
        if (this.state !== 'RUBBING' || !this.dragInfo) {
            this.reset();
            return;
        }

        const now = performance.now();
        
        // Calculate Velocity from recent history
        // Get sample from 100ms ago approx? Or just start vs end if short?
        // Let's use history.
        if (this.dragInfo.history.length > 1) {
            const last = this.dragInfo.history[this.dragInfo.history.length - 1];
            // Find a point roughly flickTimeThreshold ago
            let first = this.dragInfo.history[0];
            
            const dt = last.time - first.time;
            const dx = last.x - first.x;
            const dy = last.y - first.y;

            const velocityX = dx / (dt / 1000); // px per second
            const velocityY = dy / (dt / 1000); // px per second
            const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

            // Is it a flick?
            // High speed AND mostly upward? (Optional, but usually flick is up)
            // User requirement: "Flick: 문지르던 대상을 튕기면 발사"
            if (speed > this.flickThreshold) {
                this.state = 'FLICKING';
                this.onFlick({ x: velocityX, y: velocityY }, speed);
                this.reset();
                return;
            }
        }
        
        this.onRelease();
        this.reset();
    }

    private reset() {
        this.state = 'IDLE';
        this.dragInfo = null;
        this.accumulatedRubDistance = 0;
    }
}
