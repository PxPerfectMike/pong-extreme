/**
 * Game physics engine for Pong Extreme
 * All positions use percentage-based units (0-100)
 */

import {
	ARENA_WIDTH,
	ARENA_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_MARGIN,
	PADDLE_WIDTH,
	BALL_RADIUS,
	BALL_INITIAL_SPEED,
	BALL_MAX_SPEED,
	BALL_SPEED_INCREMENT
} from './constants';

/**
 * Physics state - subset of game state needed for physics calculations
 */
export interface PhysicsState {
	ballX: number;
	ballY: number;
	ballVelX: number;
	ballVelY: number;
	paddle1Y: number;
	paddle2Y: number;
}

/**
 * Ball state for reset/start operations
 */
export interface BallState {
	ballX: number;
	ballY: number;
	ballVelX: number;
	ballVelY: number;
}

/**
 * Maximum angle (in radians) the ball can bounce at
 */
const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60 degrees

/**
 * Update ball position based on current velocity
 */
export function updateBallPosition(state: PhysicsState): PhysicsState {
	return {
		...state,
		ballX: state.ballX + state.ballVelX,
		ballY: state.ballY + state.ballVelY
	};
}

/**
 * Check and handle wall collisions (top and bottom)
 */
export function checkWallCollision(state: PhysicsState): PhysicsState {
	let { ballY, ballVelY } = state;

	// Top wall collision
	if (ballY <= BALL_RADIUS) {
		ballY = BALL_RADIUS;
		ballVelY = Math.abs(ballVelY); // Ensure positive (moving down)
	}

	// Bottom wall collision
	if (ballY >= ARENA_HEIGHT - BALL_RADIUS) {
		ballY = ARENA_HEIGHT - BALL_RADIUS;
		ballVelY = -Math.abs(ballVelY); // Ensure negative (moving up)
	}

	return {
		...state,
		ballY,
		ballVelY
	};
}

/**
 * Check and handle paddle collisions
 */
export function checkPaddleCollision(state: PhysicsState): PhysicsState {
	const { ballX, ballY, ballVelX, ballVelY, paddle1Y, paddle2Y } = state;

	// Calculate current ball speed
	const currentSpeed = Math.sqrt(ballVelX ** 2 + ballVelY ** 2);

	// Left paddle (paddle1) collision
	const leftPaddleX = PADDLE_MARGIN + PADDLE_WIDTH;
	const paddle1Top = paddle1Y - PADDLE_HEIGHT / 2;
	const paddle1Bottom = paddle1Y + PADDLE_HEIGHT / 2;

	if (
		ballVelX < 0 && // Moving left
		ballX - BALL_RADIUS <= leftPaddleX &&
		ballX + BALL_RADIUS >= PADDLE_MARGIN &&
		ballY >= paddle1Top &&
		ballY <= paddle1Bottom
	) {
		// Calculate bounce angle based on where ball hit paddle
		const bounceAngle = calculateBallAngle(ballY, paddle1Y);

		// Increase speed slightly, up to max
		const newSpeed = Math.min(currentSpeed + BALL_SPEED_INCREMENT, BALL_MAX_SPEED);

		// Set new velocity (moving right now)
		const newVelX = Math.abs(newSpeed * Math.cos(bounceAngle));
		const newVelY = newSpeed * Math.sin(bounceAngle);

		return {
			...state,
			ballX: leftPaddleX + BALL_RADIUS, // Push ball out of paddle
			ballVelX: newVelX,
			ballVelY: newVelY
		};
	}

	// Right paddle (paddle2) collision
	const rightPaddleX = ARENA_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH;
	const paddle2Top = paddle2Y - PADDLE_HEIGHT / 2;
	const paddle2Bottom = paddle2Y + PADDLE_HEIGHT / 2;

	if (
		ballVelX > 0 && // Moving right
		ballX + BALL_RADIUS >= rightPaddleX &&
		ballX - BALL_RADIUS <= ARENA_WIDTH - PADDLE_MARGIN &&
		ballY >= paddle2Top &&
		ballY <= paddle2Bottom
	) {
		// Calculate bounce angle based on where ball hit paddle
		const bounceAngle = calculateBallAngle(ballY, paddle2Y);

		// Increase speed slightly, up to max
		const newSpeed = Math.min(currentSpeed + BALL_SPEED_INCREMENT, BALL_MAX_SPEED);

		// Set new velocity (moving left now)
		const newVelX = -Math.abs(newSpeed * Math.cos(bounceAngle));
		const newVelY = newSpeed * Math.sin(bounceAngle);

		return {
			...state,
			ballX: rightPaddleX - BALL_RADIUS, // Push ball out of paddle
			ballVelX: newVelX,
			ballVelY: newVelY
		};
	}

	return state;
}

/**
 * Check if ball has scored (exited left or right)
 * Returns 'player1' if player1 scored (ball exited right)
 * Returns 'player2' if player2 scored (ball exited left)
 * Returns null if no score
 */
export function checkScoring(state: PhysicsState): 'player1' | 'player2' | null {
	const { ballX } = state;

	// Ball exited left - player2 scores
	if (ballX < -BALL_RADIUS) {
		return 'player2';
	}

	// Ball exited right - player1 scores
	if (ballX > ARENA_WIDTH + BALL_RADIUS) {
		return 'player1';
	}

	return null;
}

/**
 * Clamp paddle position to valid range within arena
 */
export function clampPaddlePosition(y: number): number {
	const minY = PADDLE_HEIGHT / 2;
	const maxY = ARENA_HEIGHT - PADDLE_HEIGHT / 2;
	return Math.max(minY, Math.min(maxY, y));
}

/**
 * Reset ball to center with zero velocity
 */
export function resetBall(): BallState {
	return {
		ballX: 50,
		ballY: 50,
		ballVelX: 0,
		ballVelY: 0
	};
}

/**
 * Start ball moving towards specified player
 */
export function startBall(towardsPlayer: 'player1' | 'player2'): BallState {
	// Random vertical angle between -45 and 45 degrees
	const angle = (Math.random() - 0.5) * (Math.PI / 2);

	// Player1 is on LEFT (X=0), Player2 is on RIGHT (X=100)
	// Negative X = towards left (player1), Positive X = towards right (player2)
	const direction = towardsPlayer === 'player1' ? -1 : 1;

	return {
		ballX: 50,
		ballY: 50,
		ballVelX: direction * BALL_INITIAL_SPEED * Math.cos(angle),
		ballVelY: BALL_INITIAL_SPEED * Math.sin(angle)
	};
}

/**
 * Calculate bounce angle based on where ball hit the paddle
 * Returns angle in radians
 * - Negative angle = ball goes up
 * - Positive angle = ball goes down
 * - Zero = straight horizontal
 */
export function calculateBallAngle(ballY: number, paddleY: number): number {
	// Calculate relative hit position (-1 to 1)
	// -1 = top of paddle, 0 = center, 1 = bottom
	const relativeHit = (ballY - paddleY) / (PADDLE_HEIGHT / 2);

	// Clamp to valid range
	const clampedHit = Math.max(-1, Math.min(1, relativeHit));

	// Convert to angle (max 60 degrees)
	return clampedHit * MAX_BOUNCE_ANGLE;
}

/**
 * Run a complete physics tick
 * Updates ball position and handles all collisions
 */
export function physicsTick(state: PhysicsState): {
	state: PhysicsState;
	scored: 'player1' | 'player2' | null;
} {
	// Update ball position
	let newState = updateBallPosition(state);

	// Check wall collisions
	newState = checkWallCollision(newState);

	// Check paddle collisions
	newState = checkPaddleCollision(newState);

	// Check for scoring
	const scored = checkScoring(newState);

	return { state: newState, scored };
}
