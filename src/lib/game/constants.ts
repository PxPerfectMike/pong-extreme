/**
 * Game constants for Pong Extreme
 * All dimensions use percentage-based units (0-100) for responsive scaling
 */

// Arena dimensions (percentage-based)
export const ARENA_WIDTH = 100;
export const ARENA_HEIGHT = 100;

// Paddle dimensions
export const PADDLE_WIDTH = 3;
export const PADDLE_HEIGHT = 20;
export const PADDLE_MARGIN = 2; // Distance from edge

// Ball dimensions
export const BALL_RADIUS = 2;

// Ball speed settings (percentage units per tick)
export const BALL_INITIAL_SPEED = 0.8;
export const BALL_MAX_SPEED = 2.0;
export const BALL_SPEED_INCREMENT = 0.05;

// Game rules
export const WINNING_SCORE = 7;
export const COUNTDOWN_SECONDS = 3;
export const GAME_TICK_RATE = 1000 / 60; // ~16.67ms for 60fps

// Username validation
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,15}$/;

// Network settings
export const MATCHMAKER_ROOM = 'global-matchmaker';
