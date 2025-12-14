import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Bug, Booger, Particle } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOOGER_SPEED, BOOGER_RADIUS, COLORS, SPAWN_RATE_MS, GAME_DURATION_SEC, PLAYER_Y_OFFSET } from '../constants';
import { InputSystem } from '../services/InputSystem';
import { PhysicsSystem } from '../services/PhysicsSystem';

interface GameCanvasProps {
  gameState: GameState;
  onScoreUpdate: (score: number) => void;
  onTimeUpdate: (time: number) => void;
  onGameOver: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onScoreUpdate, onTimeUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Game State Refs
  const bugs = useRef<Bug[]>([]);
  const boogers = useRef<Booger[]>([]); // We still keep a ref for rendering, but PhysicsSystem manages them logic-wise?
  // Actually, PhysicsSystem manages the "active" booger being rolled. Flying boogers could be in PhysicsSystem too, or just here.
  // For Phase 1, the PhysicsSystem provided assumes one active booger ('booger') and handles 'launch'. 
  // We need to manage the list of launched boogers here or extend PhysicsSystem. 
  // Let's extend PhysicsSystem usage: it manages the "current" booger. We add launched ones to the list.

  const particles = useRef<Particle[]>([]);
  const lastSpawnTime = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(GAME_DURATION_SEC);
  const lastTimeRef = useRef<number>(0);

  // Systems
  const inputSystem = useRef<InputSystem | null>(null);
  const physicsSystem = useRef<PhysicsSystem | null>(null);

  // Initialize Systems
  useEffect(() => {
    physicsSystem.current = new PhysicsSystem();

    inputSystem.current = new InputSystem(
      // onRub
      (distance) => {
        if (gameState !== GameState.PLAYING) return;
        const result = physicsSystem.current?.growBooger(distance);
        if (result === 'NOSEBLEED') {
          // Handle Nosebleed (Phase 1: Just lose the booger, maybe flash screen?)
          console.log("NOSEBLEED!");
        }
      },
      // onFlick
      (velocity, speed) => {
        if (gameState !== GameState.PLAYING) return;
        const currentBooger = physicsSystem.current?.getBooger();
        if (currentBooger) {
          physicsSystem.current?.launchBooger(velocity, speed);
          // Transfer ownership to local list for flight
          boogers.current.push(currentBooger);
          physicsSystem.current?.clear(); // Clear 'active' slot
        }
      },
      // onRelease
      () => {
        // If released without flick, maybe reset or keep? 
        // Design says "Flick: Rapid swipe". If just release, maybe it falls?
        // For now, let's clear it (failed shot).
        physicsSystem.current?.clear();
      }
    );
  }, [gameState]);

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

    // Probability Distribution (Same as before)
    if (typeRoll > 0.97) {
      type = 'goldenBeetle'; radius = 12; speed = 12; points = 500; color = COLORS.bugGoldenBeetle; wobbleSpeed = 0.002;
    } else if (typeRoll > 0.85) {
      type = 'bee'; radius = 13; speed = 5; points = 80; color = COLORS.bugBee; wobbleSpeed = 0.02;
    } else if (typeRoll > 0.70) {
      type = 'ladybug'; radius = 12; speed = 4; points = 30; color = COLORS.bugLadybug; wobbleSpeed = 0.005;
    } else if (typeRoll > 0.55) {
      type = 'moth'; radius = 18; speed = 1.5; points = 20; color = COLORS.bugMoth; wobbleSpeed = 0.015;
    } else if (typeRoll > 0.35) {
      type = 'mosquito'; radius = 10; speed = 7; points = 50; color = COLORS.bugMosquito; wobbleSpeed = 0.01;
    }

    const y = Math.random() * (CANVAS_HEIGHT / 2) + 50;
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

  // Input Listeners
  useEffect(() => {
    const handleStart = (x: number, y: number) => {
      if (gameState !== GameState.PLAYING) return;
      // Create new booger if none active
      if (!physicsSystem.current?.getBooger()) {
        physicsSystem.current?.createBooger(x, y);
      }
      inputSystem.current?.startDrag(x, y);
    }

    const handleMove = (x: number, y: number) => {
      inputSystem.current?.updateDrag(x, y);

      // Update booger position to finger if holding
      const activeBooger = physicsSystem.current?.getBooger();
      if (activeBooger && activeBooger.dy === 0) { // Only if not flying
        activeBooger.x = x;
        activeBooger.y = y;
      }
    }

    const handleEnd = (x: number, y: number) => {
      inputSystem.current?.endDrag(x, y);
    }

    const mouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height; // Need scaleY too
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      handleMove(x, y);
    };
    const mouseDown = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      handleStart(x, y);
    };
    const mouseUp = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      handleEnd(x, y);
    };

    const touchMove = (e: TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.touches[0].clientX - rect.left) * scaleX;
      const y = (e.touches[0].clientY - rect.top) * scaleY;
      handleMove(x, y);
    };
    const touchStart = (e: TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.touches[0].clientX - rect.left) * scaleX;
      const y = (e.touches[0].clientY - rect.top) * scaleY;
      handleStart(x, y);
    };
    const touchEnd = (e: TouchEvent) => {
      // Touch end usually doesn't have ClientX, use last known? 
      // InputSystem tracks history, so it's fine.
      // We can just pass 0,0 or last known. InputSystem logic mainly relies on history for flick.
      handleEnd(0, 0);
    };

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);

    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: false });
    window.addEventListener('touchend', touchEnd);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchend', touchEnd);
    };
  }, [gameState]);

  // Main Loop
  const update = useCallback((time: number) => {
    if (gameState !== GameState.PLAYING) return;

    const deltaTime = (time - lastTimeRef.current) / 1000; // Seconds
    lastTimeRef.current = time;

    // 0. Init lastTime
    if (deltaTime > 1) { // First frame or pause
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    // 1. Timer
    timeLeftRef.current -= deltaTime;
    if (timeLeftRef.current <= 0) {
      timeLeftRef.current = 0;
      onTimeUpdate(0);
      onGameOver();
      return;
    }
    onTimeUpdate(timeLeftRef.current);

    // 2. Spawning
    if (time - lastSpawnTime.current > SPAWN_RATE_MS) {
      spawnBug();
      lastSpawnTime.current = time;
    }

    // 3. Physics & Drawing
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Physics Update ---
    physicsSystem.current?.update(deltaTime, boogers.current);

    // --- Draw Player (Seungjae - Placeholder Face) ---
    // Just a circle at bottom for now
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.fillStyle = '#ffccaa'; // Face
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-20, -50, 5, 0, Math.PI * 2);
    ctx.arc(20, -50, 5, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.beginPath();
    ctx.arc(0, -30, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();


    // --- Update & Draw Bugs ---
    bugs.current.forEach((bug, index) => {
      // Move
      bug.x += bug.dx;
      bug.y += Math.sin(time * bug.wobbleSpeed + bug.wobbleOffset) * 0.5;

      // Draw Bug
      ctx.save();
      ctx.translate(bug.x, bug.y);
      if (bug.dx < 0) ctx.scale(-1, 1);

      ctx.fillStyle = bug.color;
      ctx.beginPath();
      ctx.arc(0, 0, bug.radius, 0, Math.PI * 2);
      ctx.fill();

      // Wings logic... (Simplified for brevity in update, keeping existing visual logic ideally)
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(-5, -5, 8, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Despawn
      if ((bug.dx > 0 && bug.x > CANVAS_WIDTH + 50) || (bug.dx < 0 && bug.x < -50)) {
        bugs.current.splice(index, 1);
      }
    });

    // --- Draw Active Booger (Being rolled) ---
    const activeBooger = physicsSystem.current?.getBooger();
    if (activeBooger) {
      ctx.save();
      ctx.translate(activeBooger.x, activeBooger.y);
      ctx.fillStyle = activeBooger.color;
      ctx.beginPath();
      ctx.arc(0, 0, activeBooger.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- Draw Launched Boogers ---
    for (let i = boogers.current.length - 1; i >= 0; i--) {
      const b = boogers.current[i];
      // Physics updated in physicsSystem.update()

      // Draw
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Despawn
      if (b.y > CANVAS_HEIGHT + 50 || b.y < -100) {
        boogers.current.splice(i, 1);
        continue;
      }

      // Collision
      let hit = false;
      for (let j = bugs.current.length - 1; j >= 0; j--) {
        const bug = bugs.current[j];
        const dist = Math.hypot(b.x - bug.x, b.y - bug.y);
        if (dist < b.radius + bug.radius) {
          createExplosion(bug.x, bug.y, COLORS.splat);
          scoreRef.current += bug.points;
          onScoreUpdate(scoreRef.current);
          bugs.current.splice(j, 1);
          boogers.current.splice(i, 1); // Bullet destroys one bug? Or penetrates? Let's destroy.
          hit = true;
          break;
        }
      }
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
      scoreRef.current = 0;
      timeLeftRef.current = GAME_DURATION_SEC;
      bugs.current = [];
      boogers.current = [];
      particles.current = [];
      lastTimeRef.current = performance.now();
      lastSpawnTime.current = 0;
      physicsSystem.current?.clear();

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