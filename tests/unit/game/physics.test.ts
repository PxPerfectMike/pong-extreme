import { describe, it, expect, beforeEach } from 'vitest';
import {
	updateBallPosition,
	checkWallCollision,
	checkPaddleCollision,
	checkScoring,
	clampPaddlePosition,
	resetBall,
	startBall,
	calculateBallAngle,
	type PhysicsState
} from '$game/physics';
import {
	ARENA_WIDTH,
	ARENA_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_MARGIN,
	BALL_RADIUS,
	BALL_INITIAL_SPEED,
	BALL_MAX_SPEED
} from '$game/constants';

describe('Game Physics', () => {
	let state: PhysicsState;

	beforeEach(() => {
		state = {
			ballX: 50,
			ballY: 50,
			ballVelX: 1,
			ballVelY: 0.5,
			paddle1Y: 50,
			paddle2Y: 50
		};
	});

	describe('updateBallPosition', () => {
		it('should move ball by velocity', () => {
			const result = updateBallPosition(state);
			expect(result.ballX).toBe(51);
			expect(result.ballY).toBe(50.5);
		});

		it('should handle negative velocity', () => {
			state.ballVelX = -1;
			state.ballVelY = -0.5;
			const result = updateBallPosition(state);
			expect(result.ballX).toBe(49);
			expect(result.ballY).toBe(49.5);
		});

		it('should handle zero velocity', () => {
			state.ballVelX = 0;
			state.ballVelY = 0;
			const result = updateBallPosition(state);
			expect(result.ballX).toBe(50);
			expect(result.ballY).toBe(50);
		});
	});

	describe('checkWallCollision', () => {
		it('should bounce off top wall', () => {
			state.ballY = BALL_RADIUS - 0.1;
			state.ballVelY = -1;
			const result = checkWallCollision(state);
			expect(result.ballVelY).toBeGreaterThan(0);
			expect(result.ballY).toBeGreaterThanOrEqual(BALL_RADIUS);
		});

		it('should bounce off bottom wall', () => {
			state.ballY = ARENA_HEIGHT - BALL_RADIUS + 0.1;
			state.ballVelY = 1;
			const result = checkWallCollision(state);
			expect(result.ballVelY).toBeLessThan(0);
			expect(result.ballY).toBeLessThanOrEqual(ARENA_HEIGHT - BALL_RADIUS);
		});

		it('should not affect ball in middle of arena', () => {
			const result = checkWallCollision(state);
			expect(result.ballVelY).toBe(0.5);
			expect(result.ballY).toBe(50);
		});
	});

	describe('checkPaddleCollision', () => {
		it('should bounce off left paddle (paddle1)', () => {
			state.ballX = PADDLE_MARGIN + BALL_RADIUS;
			state.ballVelX = -1;
			state.paddle1Y = 50;
			state.ballY = 50; // Ball aligned with paddle center

			const result = checkPaddleCollision(state);
			expect(result.ballVelX).toBeGreaterThan(0);
		});

		it('should bounce off right paddle (paddle2)', () => {
			state.ballX = ARENA_WIDTH - PADDLE_MARGIN - BALL_RADIUS;
			state.ballVelX = 1;
			state.paddle2Y = 50;
			state.ballY = 50;

			const result = checkPaddleCollision(state);
			expect(result.ballVelX).toBeLessThan(0);
		});

		it('should miss paddle if ball not aligned vertically', () => {
			state.ballX = PADDLE_MARGIN + BALL_RADIUS;
			state.ballVelX = -1;
			state.paddle1Y = 10; // Paddle at top
			state.ballY = 90; // Ball at bottom

			const result = checkPaddleCollision(state);
			expect(result.ballVelX).toBe(-1); // No collision, velocity unchanged
		});

		it('should increase ball speed on paddle hit up to max', () => {
			state.ballX = PADDLE_MARGIN + BALL_RADIUS;
			state.ballVelX = -BALL_INITIAL_SPEED;
			state.paddle1Y = 50;
			state.ballY = 50;

			const result = checkPaddleCollision(state);
			const newSpeed = Math.sqrt(result.ballVelX ** 2 + result.ballVelY ** 2);
			expect(newSpeed).toBeGreaterThan(BALL_INITIAL_SPEED);
			expect(newSpeed).toBeLessThanOrEqual(BALL_MAX_SPEED);
		});

		it('should change vertical velocity based on hit position', () => {
			// Hit top of paddle
			state.ballX = PADDLE_MARGIN + BALL_RADIUS;
			state.ballVelX = -1;
			state.paddle1Y = 50;
			state.ballY = 50 - PADDLE_HEIGHT / 2 + 1; // Near top of paddle

			const resultTop = checkPaddleCollision({ ...state });

			// Hit bottom of paddle
			state.ballY = 50 + PADDLE_HEIGHT / 2 - 1; // Near bottom of paddle
			const resultBottom = checkPaddleCollision({ ...state });

			// Top hit should have different Y velocity than bottom hit
			expect(resultTop.ballVelY).not.toBe(resultBottom.ballVelY);
		});
	});

	describe('checkScoring', () => {
		it('should detect player2 scores (ball exits left)', () => {
			state.ballX = -BALL_RADIUS - 1;
			const result = checkScoring(state);
			expect(result).toBe('player2');
		});

		it('should detect player1 scores (ball exits right)', () => {
			state.ballX = ARENA_WIDTH + BALL_RADIUS + 1;
			const result = checkScoring(state);
			expect(result).toBe('player1');
		});

		it('should return null when ball is in play', () => {
			state.ballX = 50;
			const result = checkScoring(state);
			expect(result).toBeNull();
		});

		it('should return null when ball is at edge but not past', () => {
			state.ballX = BALL_RADIUS;
			expect(checkScoring(state)).toBeNull();

			state.ballX = ARENA_WIDTH - BALL_RADIUS;
			expect(checkScoring(state)).toBeNull();
		});
	});

	describe('clampPaddlePosition', () => {
		it('should clamp paddle within arena bounds', () => {
			expect(clampPaddlePosition(50)).toBe(50);
		});

		it('should clamp paddle at top edge', () => {
			const result = clampPaddlePosition(0);
			expect(result).toBeGreaterThanOrEqual(PADDLE_HEIGHT / 2);
		});

		it('should clamp paddle at bottom edge', () => {
			const result = clampPaddlePosition(100);
			expect(result).toBeLessThanOrEqual(ARENA_HEIGHT - PADDLE_HEIGHT / 2);
		});

		it('should return same value for valid positions', () => {
			const validY = 50;
			expect(clampPaddlePosition(validY)).toBe(validY);
		});
	});

	describe('resetBall', () => {
		it('should reset ball to center', () => {
			const result = resetBall();
			expect(result.ballX).toBe(50);
			expect(result.ballY).toBe(50);
		});

		it('should stop ball velocity', () => {
			const result = resetBall();
			expect(result.ballVelX).toBe(0);
			expect(result.ballVelY).toBe(0);
		});
	});

	describe('startBall', () => {
		it('should set ball velocity towards a player', () => {
			const result = startBall('player1');
			expect(result.ballVelX).toBeGreaterThan(0); // Moving right (towards player1 side)

			const result2 = startBall('player2');
			expect(result2.ballVelX).toBeLessThan(0); // Moving left (towards player2 side)
		});

		it('should have initial speed magnitude', () => {
			const result = startBall('player1');
			const speed = Math.sqrt(result.ballVelX ** 2 + result.ballVelY ** 2);
			expect(speed).toBeCloseTo(BALL_INITIAL_SPEED, 1);
		});

		it('should have some vertical velocity', () => {
			// Run multiple times to ensure randomness includes Y component
			let hasYVelocity = false;
			for (let i = 0; i < 10; i++) {
				const result = startBall('player1');
				if (result.ballVelY !== 0) {
					hasYVelocity = true;
					break;
				}
			}
			expect(hasYVelocity).toBe(true);
		});
	});

	describe('calculateBallAngle', () => {
		it('should return 0 for center hit', () => {
			const angle = calculateBallAngle(50, 50); // Ball at paddle center
			expect(angle).toBeCloseTo(0, 1);
		});

		it('should return positive angle for hit above center', () => {
			const angle = calculateBallAngle(40, 50); // Ball above paddle center
			expect(angle).toBeLessThan(0); // Negative angle = upward
		});

		it('should return negative angle for hit below center', () => {
			const angle = calculateBallAngle(60, 50); // Ball below paddle center
			expect(angle).toBeGreaterThan(0); // Positive angle = downward
		});

		it('should have maximum angle limit', () => {
			const maxUp = calculateBallAngle(0, 50);
			const maxDown = calculateBallAngle(100, 50);

			expect(Math.abs(maxUp)).toBeLessThanOrEqual(Math.PI / 3); // Max 60 degrees
			expect(Math.abs(maxDown)).toBeLessThanOrEqual(Math.PI / 3);
		});
	});
});
