import { describe, it, expect } from 'vitest';
import {
	createInitialGameState,
	createInitialPlayerInfo,
	isValidGameStatus,
	isValidPlayerRole,
	type GameState,
	type PlayerInfo,
	type GameStatus,
	type PlayerRole
} from '$game/types';

describe('Game Types', () => {
	describe('createInitialGameState', () => {
		it('should create a valid initial game state', () => {
			const state = createInitialGameState();

			expect(state).toBeDefined();
			expect(state.ballX).toBe(50);
			expect(state.ballY).toBe(50);
			expect(state.ballVelX).toBe(0);
			expect(state.ballVelY).toBe(0);
			expect(state.paddle1Y).toBe(50);
			expect(state.paddle2Y).toBe(50);
			expect(state.score1).toBe(0);
			expect(state.score2).toBe(0);
			expect(state.status).toBe('waiting');
			expect(state.winner).toBeNull();
			expect(state.countdown).toBe(0);
		});

		it('should have all required properties', () => {
			const state = createInitialGameState();
			const keys = Object.keys(state);

			expect(keys).toContain('ballX');
			expect(keys).toContain('ballY');
			expect(keys).toContain('ballVelX');
			expect(keys).toContain('ballVelY');
			expect(keys).toContain('paddle1Y');
			expect(keys).toContain('paddle2Y');
			expect(keys).toContain('score1');
			expect(keys).toContain('score2');
			expect(keys).toContain('status');
			expect(keys).toContain('winner');
			expect(keys).toContain('countdown');
		});
	});

	describe('createInitialPlayerInfo', () => {
		it('should create player info with provided values', () => {
			const player = createInitialPlayerInfo('player-123', 'TestPlayer', 'host');

			expect(player.id).toBe('player-123');
			expect(player.username).toBe('TestPlayer');
			expect(player.role).toBe('host');
		});

		it('should accept guest role', () => {
			const player = createInitialPlayerInfo('player-456', 'GuestPlayer', 'guest');

			expect(player.role).toBe('guest');
		});
	});

	describe('isValidGameStatus', () => {
		it('should return true for valid statuses', () => {
			const validStatuses: GameStatus[] = ['waiting', 'countdown', 'playing', 'paused', 'finished'];

			validStatuses.forEach((status) => {
				expect(isValidGameStatus(status)).toBe(true);
			});
		});

		it('should return false for invalid statuses', () => {
			expect(isValidGameStatus('invalid')).toBe(false);
			expect(isValidGameStatus('')).toBe(false);
			expect(isValidGameStatus(null)).toBe(false);
			expect(isValidGameStatus(undefined)).toBe(false);
			expect(isValidGameStatus(123)).toBe(false);
		});
	});

	describe('isValidPlayerRole', () => {
		it('should return true for valid roles', () => {
			expect(isValidPlayerRole('host')).toBe(true);
			expect(isValidPlayerRole('guest')).toBe(true);
		});

		it('should return false for invalid roles', () => {
			expect(isValidPlayerRole('admin')).toBe(false);
			expect(isValidPlayerRole('')).toBe(false);
			expect(isValidPlayerRole(null)).toBe(false);
			expect(isValidPlayerRole(undefined)).toBe(false);
		});
	});
});

describe('Message Types', () => {
	describe('PaddleInput validation', () => {
		it('should validate paddle input structure', () => {
			const validInput = {
				type: 'PADDLE_MOVE' as const,
				y: 50,
				timestamp: Date.now()
			};

			expect(validInput.type).toBe('PADDLE_MOVE');
			expect(typeof validInput.y).toBe('number');
			expect(typeof validInput.timestamp).toBe('number');
		});
	});
});
