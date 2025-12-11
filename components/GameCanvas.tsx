import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Bug, Booger, Particle } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOOGER_SPEED, BOOGER_RADIUS, COLORS, SPAWN_RATE_MS, GAME_DURATION_SEC, PLAYER_Y_OFFSET } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onScoreUpdate: (score: number) => void;
  onTimeUpdate: (time: number) => void;
  onGameOver: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onScoreUpdate, onTimeUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (Mutable for loop performance)
  const playerX = useRef<number>(CANVAS_WIDTH / 2);
  const bugs = useRef<Bug[]>([]);
  const boogers = useRef<Booger[]>([]);
  const particles = useRef<Particle[]>([]);
  const lastSpawnTime = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(GAME_DURATION_SEC);
  const lastTimeRef = useRef<number>(0);

  // Helper: Create a particle explosion
  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particles.current.push({
        id: Math.random().toString(),
        x,
        y,
        dx: (Math.random() - 0.5) * 8,
        dy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 4 + 2,
        color,
        life: 1.0,
        maxLife: 1.0
      });
    }
  };

  // Helper: Spawn a bug
  const spawnBug = () => {
    const typeRoll = Math.random();
    let type: Bug['type'] = 'fly';
    let radius = 15;
    let speed = 2;
    let points = 10;
    let color = COLORS.bugFly;
    let wobbleSpeed = 0.005;

    // Probability Distribution
    if (typeRoll > 0.97) { // 3% Golden Beetle
      type = 'goldenBeetle';
      radius = 12;
      speed = 12; // Very Fast
      points = 500;
      color = COLORS.bugGoldenBeetle;
      wobbleSpeed = 0.002;
    } else if (typeRoll > 0.85) { // 12% Bee
      type = 'bee';
      radius = 13;
      speed = 5;
      points = 80;
      color = COLORS.bugBee;
      wobbleSpeed = 0.02; // Buzzing vibration
    } else if (typeRoll > 0.70) { // 15% Ladybug
      type = 'ladybug';
      radius = 12;
      speed = 4;
      points = 30;
      color = COLORS.bugLadybug;
      wobbleSpeed = 0.005;
    } else if (typeRoll > 0.55) { // 15% Moth
      type = 'moth';
      radius = 18; // Large
      speed = 1.5; // Slow
      points = 20;
      color = COLORS.bugMoth;
      wobbleSpeed = 0.015; // Fluttery
    } else if (typeRoll > 0.35) { // 20% Mosquito
      type = 'mosquito';
      radius = 10;
      speed = 7; // Fast
      points = 50;
      color = COLORS.bugMosquito;
      wobbleSpeed = 0.01;
    } 
    // Remaining 35% is Fly (default)

    const y = Math.random() * (CANVAS_HEIGHT / 2) + 50; // Top half
    const direction = Math.random() > 0.5 ? 1 : -1;
    const x = direction === 1 ? -radius : CANVAS_WIDTH + radius;

    bugs.current.push({
      id: Math.random().toString(),
      x,
      y,
      dx: speed * direction,
      dy: 0,
      radius,
      color,
      type,
      points,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed
    });
  };

  // Helper: Shoot
  const shoot = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    boogers.current.push({
      id: Math.random().toString(),
      x: playerX.current,
      y: CANVAS_HEIGHT - PLAYER_Y_OFFSET - 20,
      dx: 0,
      dy: -BOOGER_SPEED,
      radius: BOOGER_RADIUS,
      color: COLORS.booger,
      rotation: Math.random() * Math.PI * 2
    });
  }, [gameState]);

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      let x = (e.clientX - rect.left) * scaleX;
      // Clamp
      x = Math.max(20, Math.min(CANVAS_WIDTH - 20, x));
      playerX.current = x;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      let x = (e.touches[0].clientX - rect.left) * scaleX;
      x = Math.max(20, Math.min(CANVAS_WIDTH - 20, x));
      playerX.current = x;
    };

    const handleClick = () => {
      shoot();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mousedown', handleClick);
    // Touch start also shoots
    const handleTouchStart = (e: TouchEvent) => {
       if (!canvasRef.current) return;
       const rect = canvasRef.current.getBoundingClientRect();
       const scaleX = CANVAS_WIDTH / rect.width;
       let x = (e.touches[0].clientX - rect.left) * scaleX;
       playerX.current = Math.max(20, Math.min(CANVAS_WIDTH - 20, x));
       shoot();
    }
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gameState, shoot]);

  // Main Loop
  const update = useCallback((time: number) => {
    if (gameState !== GameState.PLAYING) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // 1. Timer
    if (deltaTime < 1000) { // prevent huge jumps on tab switch
        timeLeftRef.current -= deltaTime / 1000;
        if (timeLeftRef.current <= 0) {
            timeLeftRef.current = 0;
            onTimeUpdate(0);
            onGameOver();
            return;
        }
        onTimeUpdate(timeLeftRef.current);
    }

    // 2. Spawning
    if (time - lastSpawnTime.current > SPAWN_RATE_MS) {
      spawnBug();
      lastSpawnTime.current = time;
    }

    // 3. Physics & Drawing
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Draw Player (Finger/Nose) ---
    ctx.save();
    ctx.translate(playerX.current, CANVAS_HEIGHT);
    
    // Finger Body
    ctx.fillStyle = '#fca5a5'; // Light red/pink skin
    ctx.beginPath();
    ctx.roundRect(-20, -PLAYER_Y_OFFSET, 40, PLAYER_Y_OFFSET + 10, 20);
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Finger Nail
    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.ellipse(0, -PLAYER_Y_OFFSET + 10, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aim Line (Subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_Y_OFFSET);
    ctx.lineTo(0, -CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();


    // --- Update & Draw Bugs ---
    bugs.current.forEach((bug, index) => {
      // Move
      bug.x += bug.dx;
      // Wobble y - use specific wobbleSpeed
      bug.y += Math.sin(time * bug.wobbleSpeed + bug.wobbleOffset) * 0.5;

      // Draw Bug
      ctx.save();
      ctx.translate(bug.x, bug.y);
      if (bug.dx < 0) ctx.scale(-1, 1); // Flip if moving left

      // Draw Wings (Different for Moth)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      if (bug.type === 'moth') {
         // Moth has larger wings
         ctx.beginPath();
         ctx.ellipse(-5, -8, 12, 6, Math.PI / 3, 0, Math.PI * 2);
         ctx.fill();
         ctx.beginPath();
         ctx.ellipse(-5, 8, 12, 6, -Math.PI / 3, 0, Math.PI * 2);
         ctx.fill();
      } else {
         // Standard wings
         ctx.beginPath();
         ctx.ellipse(-5, -5, 8, 4, Math.PI / 4, 0, Math.PI * 2);
         ctx.fill();
         ctx.beginPath();
         ctx.ellipse(-5, 5, 8, 4, -Math.PI / 4, 0, Math.PI * 2);
         ctx.fill();
      }

      // Body
      ctx.fillStyle = bug.color;
      ctx.beginPath();
      ctx.arc(0, 0, bug.radius, 0, Math.PI * 2);
      ctx.fill();

      // Special Drawing for Bee (Stripes)
      if (bug.type === 'bee') {
        ctx.fillStyle = COLORS.bugBeeStripe;
        ctx.beginPath();
        ctx.rect(-bug.radius/3, -bug.radius + 2, 4, bug.radius * 1.8);
        ctx.fill();
        ctx.beginPath();
        ctx.rect(bug.radius/3, -bug.radius + 4, 4, bug.radius * 1.6);
        ctx.fill();
      }
      
      // Special Drawing for Golden Beetle (Shine)
      if (bug.type === 'goldenBeetle') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-3, -3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyes (Skip for moth, hard to see)
      if (bug.type !== 'moth') {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(4, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(5, -3, 1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Moth Eyes (Darker)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(4, -3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();

      // Despawn if off screen
      if ((bug.dx > 0 && bug.x > CANVAS_WIDTH + 50) || (bug.dx < 0 && bug.x < -50)) {
        bugs.current.splice(index, 1);
      }
    });

    // --- Update & Draw Boogers ---
    for (let i = boogers.current.length - 1; i >= 0; i--) {
      const b = boogers.current[i];
      b.y += b.dy;

      // Draw Booger
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.color;
      // Irregular shape
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = '#d9f99d';
      ctx.beginPath();
      ctx.arc(-2, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Despawn
      if (b.y < -20) {
        boogers.current.splice(i, 1);
        continue;
      }

      // Collision Detection
      let hit = false;
      for (let j = bugs.current.length - 1; j >= 0; j--) {
        const bug = bugs.current[j];
        const dist = Math.hypot(b.x - bug.x, b.y - bug.y);
        
        if (dist < b.radius + bug.radius) {
          // HIT!
          createExplosion(bug.x, bug.y, bug.type === 'goldenBeetle' ? '#fde047' : COLORS.splat);
          scoreRef.current += bug.points;
          onScoreUpdate(scoreRef.current);
          
          bugs.current.splice(j, 1);
          boogers.current.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }

    // --- Update & Draw Particles ---
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 0.05;

      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, onGameOver, onScoreUpdate, onTimeUpdate]);

  // Start/Reset Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      // Reset State
      scoreRef.current = 0;
      timeLeftRef.current = GAME_DURATION_SEC;
      bugs.current = [];
      boogers.current = [];
      particles.current = [];
      lastTimeRef.current = performance.now();
      lastSpawnTime.current = 0;
      onScoreUpdate(0);
      onTimeUpdate(GAME_DURATION_SEC);
      
      requestRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, update, onScoreUpdate, onTimeUpdate]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full object-contain cursor-crosshair touch-none"
    />
  );
};

export default GameCanvas;