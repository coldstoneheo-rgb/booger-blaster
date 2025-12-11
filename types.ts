export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Entity extends Position, Velocity {
  id: string;
  radius: number;
  color: string;
}

export interface Particle extends Entity {
  life: number; // 0 to 1
  maxLife: number;
}

export interface Bug extends Entity {
  type: 'fly' | 'mosquito' | 'ladybug' | 'bee' | 'moth' | 'goldenBeetle';
  points: number;
  wobbleOffset: number;
  wobbleSpeed: number;
}

export interface Booger extends Entity {
  rotation: number;
}

export interface GameScore {
  score: number;
  highScore: number;
}