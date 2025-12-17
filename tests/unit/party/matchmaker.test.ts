import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createMatchmakerState,
	joinQueue,
	leaveQueue,
	findMatch,
	isUsernameTaken,
	type MatchmakerState,
	type QueuedPlayer
} from '$party/matchmakerLogic';

describe('Matchmaker Logic', () => {
	let state: MatchmakerState;

	beforeEach(() => {
		state = createMatchmakerState();
	});

	describe('createMatchmakerState', () => {
		it('should create an empty state', () => {
			const newState = createMatchmakerState();
			expect(newState.queue).toEqual([]);
			expect(newState.activeUsernames).toEqual(new Set());
		});
	});

	describe('isUsernameTaken', () => {
		it('should return false for available username', () => {
			expect(isUsernameTaken(state, 'Player1')).toBe(false);
		});

		it('should return true for taken username', () => {
			state.activeUsernames.add('player1'); // Stored as lowercase
			expect(isUsernameTaken(state, 'Player1')).toBe(true);
		});

		it('should be case-insensitive', () => {
			state.activeUsernames.add('player1'); // Stored as lowercase
			expect(isUsernameTaken(state, 'PLAYER1')).toBe(true);
			expect(isUsernameTaken(state, 'Player1')).toBe(true);
		});
	});

	describe('joinQueue', () => {
		it('should add player to queue', () => {
			const result = joinQueue(state, 'conn-1', 'Player1');

			expect(result.success).toBe(true);
			expect(result.state.queue).toHaveLength(1);
			expect(result.state.queue[0].connectionId).toBe('conn-1');
			expect(result.state.queue[0].username).toBe('Player1');
		});

		it('should reject duplicate username', () => {
			state.activeUsernames.add('player1');
			const result = joinQueue(state, 'conn-2', 'Player1');

			expect(result.success).toBe(false);
			expect(result.error).toBe('USERNAME_TAKEN');
		});

		it('should track active usernames', () => {
			const result = joinQueue(state, 'conn-1', 'TestUser');

			expect(result.state.activeUsernames.has('testuser')).toBe(true);
		});

		it('should return queue position', () => {
			const result1 = joinQueue(state, 'conn-1', 'Player1');
			expect(result1.position).toBe(1);

			const result2 = joinQueue(result1.state, 'conn-2', 'Player2');
			expect(result2.position).toBe(2);
		});
	});

	describe('leaveQueue', () => {
		it('should remove player from queue', () => {
			const { state: stateWithPlayer } = joinQueue(state, 'conn-1', 'Player1');
			const result = leaveQueue(stateWithPlayer, 'conn-1');

			expect(result.queue).toHaveLength(0);
		});

		it('should free the username', () => {
			const { state: stateWithPlayer } = joinQueue(state, 'conn-1', 'Player1');
			const result = leaveQueue(stateWithPlayer, 'conn-1');

			expect(result.activeUsernames.has('player1')).toBe(false);
		});

		it('should handle non-existent connection gracefully', () => {
			const result = leaveQueue(state, 'non-existent');
			expect(result.queue).toHaveLength(0);
		});
	});

	describe('findMatch', () => {
		it('should return null when queue has less than 2 players', () => {
			const { state: stateWithOne } = joinQueue(state, 'conn-1', 'Player1');
			const result = findMatch(stateWithOne);

			expect(result.match).toBeNull();
		});

		it('should match two players when available', () => {
			let currentState = state;
			const { state: state1 } = joinQueue(currentState, 'conn-1', 'Player1');
			const { state: state2 } = joinQueue(state1, 'conn-2', 'Player2');

			const result = findMatch(state2);

			expect(result.match).not.toBeNull();
			expect(result.match?.player1.username).toBe('Player1');
			expect(result.match?.player2.username).toBe('Player2');
			expect(result.match?.gameRoomId).toBeDefined();
		});

		it('should remove matched players from queue', () => {
			let currentState = state;
			const { state: state1 } = joinQueue(currentState, 'conn-1', 'Player1');
			const { state: state2 } = joinQueue(state1, 'conn-2', 'Player2');

			const result = findMatch(state2);

			expect(result.state.queue).toHaveLength(0);
		});

		it('should keep usernames active after match', () => {
			let currentState = state;
			const { state: state1 } = joinQueue(currentState, 'conn-1', 'Player1');
			const { state: state2 } = joinQueue(state1, 'conn-2', 'Player2');

			const result = findMatch(state2);

			// Usernames should still be active during game
			expect(result.state.activeUsernames.has('player1')).toBe(true);
			expect(result.state.activeUsernames.has('player2')).toBe(true);
		});

		it('should generate unique game room IDs', () => {
			// Create two matches
			let currentState = state;
			currentState = joinQueue(currentState, 'conn-1', 'Player1').state;
			currentState = joinQueue(currentState, 'conn-2', 'Player2').state;
			const result1 = findMatch(currentState);

			currentState = joinQueue(result1.state, 'conn-3', 'Player3').state;
			currentState = joinQueue(currentState, 'conn-4', 'Player4').state;
			const result2 = findMatch(currentState);

			expect(result1.match?.gameRoomId).not.toBe(result2.match?.gameRoomId);
		});
	});
});
