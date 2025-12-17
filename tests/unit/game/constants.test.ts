import { describe, it, expect } from 'vitest';
import {
	ARENA_WIDTH,
	ARENA_HEIGHT,
	PADDLE_WIDTH,
	PADDLE_HEIGHT,
	PADDLE_MARGIN,
	BALL_RADIUS,
	BALL_INITIAL_SPEED,
	BALL_MAX_SPEED,
	BALL_SPEED_INCREMENT,
	WINNING_SCORE,
	COUNTDOWN_SECONDS,
	GAME_TICK_RATE,
	USERNAME_MIN_LENGTH,
	USERNAME_MAX_LENGTH,
	USERNAME_PATTERN
} from '$game/constants';

describe('Game Constants', () => {
	describe('Arena dimensions', () => {
		it('should have valid arena width', () => {
			expect(ARENA_WIDTH).toBeGreaterThan(0);
			expect(ARENA_WIDTH).toBe(100); // Using percentage-based units
		});

		it('should have valid arena height', () => {
			expect(ARENA_HEIGHT).toBeGreaterThan(0);
			expect(ARENA_HEIGHT).toBe(100);
		});
	});

	describe('Paddle dimensions', () => {
		it('should have valid paddle width', () => {
			expect(PADDLE_WIDTH).toBeGreaterThan(0);
			expect(PADDLE_WIDTH).toBeLessThan(ARENA_WIDTH / 4);
		});

		it('should have valid paddle height', () => {
			expect(PADDLE_HEIGHT).toBeGreaterThan(0);
			expect(PADDLE_HEIGHT).toBeLessThan(ARENA_HEIGHT / 2);
		});

		it('should have valid paddle margin from edge', () => {
			expect(PADDLE_MARGIN).toBeGreaterThan(0);
		});
	});

	describe('Ball dimensions', () => {
		it('should have valid ball radius', () => {
			expect(BALL_RADIUS).toBeGreaterThan(0);
			expect(BALL_RADIUS).toBeLessThan(PADDLE_HEIGHT);
		});
	});

	describe('Ball speed settings', () => {
		it('should have valid initial speed', () => {
			expect(BALL_INITIAL_SPEED).toBeGreaterThan(0);
		});

		it('should have max speed greater than initial', () => {
			expect(BALL_MAX_SPEED).toBeGreaterThan(BALL_INITIAL_SPEED);
		});

		it('should have positive speed increment', () => {
			expect(BALL_SPEED_INCREMENT).toBeGreaterThan(0);
			expect(BALL_SPEED_INCREMENT).toBeLessThan(BALL_MAX_SPEED);
		});
	});

	describe('Game rules', () => {
		it('should have valid winning score', () => {
			expect(WINNING_SCORE).toBeGreaterThan(0);
			expect(WINNING_SCORE).toBe(7);
		});

		it('should have valid countdown duration', () => {
			expect(COUNTDOWN_SECONDS).toBeGreaterThan(0);
			expect(COUNTDOWN_SECONDS).toBe(3);
		});

		it('should have valid tick rate for 60fps', () => {
			expect(GAME_TICK_RATE).toBeCloseTo(1000 / 60, 1);
		});
	});

	describe('Username validation', () => {
		it('should have valid min length', () => {
			expect(USERNAME_MIN_LENGTH).toBeGreaterThanOrEqual(1);
			expect(USERNAME_MIN_LENGTH).toBe(3);
		});

		it('should have valid max length', () => {
			expect(USERNAME_MAX_LENGTH).toBeGreaterThan(USERNAME_MIN_LENGTH);
			expect(USERNAME_MAX_LENGTH).toBe(15);
		});

		it('should have valid username pattern', () => {
			expect(USERNAME_PATTERN).toBeInstanceOf(RegExp);
			// Valid usernames
			expect(USERNAME_PATTERN.test('Player1')).toBe(true);
			expect(USERNAME_PATTERN.test('test_user')).toBe(true);
			expect(USERNAME_PATTERN.test('ABC123')).toBe(true);
			// Invalid usernames
			expect(USERNAME_PATTERN.test('ab')).toBe(false); // Too short
			expect(USERNAME_PATTERN.test('user name')).toBe(false); // Space
			expect(USERNAME_PATTERN.test('user@name')).toBe(false); // Special char
		});
	});
});
