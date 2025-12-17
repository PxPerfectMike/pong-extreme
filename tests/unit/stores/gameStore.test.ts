import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	createPongStore,
	type PongStore,
	type ConnectionState
} from '$stores/gameStore';

// Mock PartySocket
vi.mock('partysocket', () => ({
	default: vi.fn().mockImplementation(() => ({
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		send: vi.fn(),
		close: vi.fn()
	}))
}));

describe('Game Store', () => {
	let store: PongStore;

	beforeEach(() => {
		store = createPongStore();
	});

	describe('createPongStore', () => {
		it('should create a store with initial state', () => {
			const state = get(store);

			expect(state.connectionState).toBe('disconnected');
			expect(state.username).toBe('');
			expect(state.gameState).toBeNull();
			expect(state.playerRole).toBeNull();
			expect(state.opponent).toBeNull();
			expect(state.queuePosition).toBe(0);
			expect(state.error).toBeNull();
		});
	});

	describe('setUsername', () => {
		it('should update username', () => {
			store.setUsername('TestPlayer');
			expect(get(store).username).toBe('TestPlayer');
		});
	});

	describe('derived stores', () => {
		it('should have isConnected derived store', () => {
			expect(get(store.isConnected)).toBe(false);
		});

		it('should have isInQueue derived store', () => {
			expect(get(store.isInQueue)).toBe(false);
		});

		it('should have isPlaying derived store', () => {
			expect(get(store.isPlaying)).toBe(false);
		});
	});

	describe('getLocalPaddleY', () => {
		it('should return paddle1Y for host', () => {
			store.update((s) => ({
				...s,
				playerRole: 'host',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 30,
					paddle2Y: 60,
					score1: 0,
					score2: 0,
					status: 'playing',
					winner: null,
					countdown: 0
				}
			}));

			expect(store.getLocalPaddleY()).toBe(30);
		});

		it('should return paddle2Y for guest', () => {
			store.update((s) => ({
				...s,
				playerRole: 'guest',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 30,
					paddle2Y: 60,
					score1: 0,
					score2: 0,
					status: 'playing',
					winner: null,
					countdown: 0
				}
			}));

			expect(store.getLocalPaddleY()).toBe(60);
		});

		it('should return 50 when no game state', () => {
			expect(store.getLocalPaddleY()).toBe(50);
		});
	});

	describe('getOpponentPaddleY', () => {
		it('should return paddle2Y for host', () => {
			store.update((s) => ({
				...s,
				playerRole: 'host',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 30,
					paddle2Y: 60,
					score1: 0,
					score2: 0,
					status: 'playing',
					winner: null,
					countdown: 0
				}
			}));

			expect(store.getOpponentPaddleY()).toBe(60);
		});

		it('should return paddle1Y for guest', () => {
			store.update((s) => ({
				...s,
				playerRole: 'guest',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 30,
					paddle2Y: 60,
					score1: 0,
					score2: 0,
					status: 'playing',
					winner: null,
					countdown: 0
				}
			}));

			expect(store.getOpponentPaddleY()).toBe(30);
		});
	});

	describe('getLocalScore and getOpponentScore', () => {
		beforeEach(() => {
			store.update((s) => ({
				...s,
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 50,
					paddle2Y: 50,
					score1: 3,
					score2: 5,
					status: 'playing',
					winner: null,
					countdown: 0
				}
			}));
		});

		it('should return correct scores for host', () => {
			store.update((s) => ({ ...s, playerRole: 'host' }));
			expect(store.getLocalScore()).toBe(3);
			expect(store.getOpponentScore()).toBe(5);
		});

		it('should return correct scores for guest', () => {
			store.update((s) => ({ ...s, playerRole: 'guest' }));
			expect(store.getLocalScore()).toBe(5);
			expect(store.getOpponentScore()).toBe(3);
		});
	});

	describe('didWin', () => {
		it('should return true when host wins', () => {
			store.update((s) => ({
				...s,
				playerRole: 'host',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 50,
					paddle2Y: 50,
					score1: 7,
					score2: 3,
					status: 'finished',
					winner: 'player1',
					countdown: 0
				}
			}));

			expect(store.didWin()).toBe(true);
		});

		it('should return false when host loses', () => {
			store.update((s) => ({
				...s,
				playerRole: 'host',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 50,
					paddle2Y: 50,
					score1: 3,
					score2: 7,
					status: 'finished',
					winner: 'player2',
					countdown: 0
				}
			}));

			expect(store.didWin()).toBe(false);
		});

		it('should return true when guest wins', () => {
			store.update((s) => ({
				...s,
				playerRole: 'guest',
				gameState: {
					ballX: 50,
					ballY: 50,
					ballVelX: 0,
					ballVelY: 0,
					paddle1Y: 50,
					paddle2Y: 50,
					score1: 3,
					score2: 7,
					status: 'finished',
					winner: 'player2',
					countdown: 0
				}
			}));

			expect(store.didWin()).toBe(true);
		});
	});
});
