import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameStore, type GameStore } from '$engine/state/createGameStore';

interface TestGameState {
	score: number;
	level: number;
	lives: number;
	playerName: string;
	inventory: string[];
}

describe('createGameStore', () => {
	const initialState: TestGameState = {
		score: 0,
		level: 1,
		lives: 3,
		playerName: 'Player',
		inventory: []
	};

	describe('creation', () => {
		it('should create a store with initial state', () => {
			const store = createGameStore(initialState);

			expect(store.get()).toEqual(initialState);
		});

		it('should create independent store instances', () => {
			const store1 = createGameStore(initialState);
			const store2 = createGameStore(initialState);

			store1.update((s) => ({ ...s, score: 100 }));

			expect(store1.get().score).toBe(100);
			expect(store2.get().score).toBe(0);
		});

		it('should deep clone initial state', () => {
			const store = createGameStore(initialState);

			// Mutate original shouldn't affect store
			initialState.inventory.push('sword');

			expect(store.get().inventory).toEqual([]);
		});
	});

	describe('get', () => {
		it('should return current state', () => {
			const store = createGameStore(initialState);

			const state = store.get();

			expect(state.score).toBe(0);
			expect(state.level).toBe(1);
			expect(state.lives).toBe(3);
		});

		it('should return a copy, not the internal state', () => {
			const store = createGameStore(initialState);

			const state = store.get();
			state.score = 999;

			expect(store.get().score).toBe(0);
		});
	});

	describe('set', () => {
		it('should replace entire state', () => {
			const store = createGameStore(initialState);
			const newState: TestGameState = {
				score: 100,
				level: 5,
				lives: 1,
				playerName: 'Hero',
				inventory: ['sword']
			};

			store.set(newState);

			expect(store.get()).toEqual(newState);
		});

		it('should notify subscribers', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			store.subscribe(callback);
			callback.mockClear();

			store.set({ ...initialState, score: 50 });

			expect(callback).toHaveBeenCalledWith(expect.objectContaining({ score: 50 }));
		});
	});

	describe('update', () => {
		it('should update state via function', () => {
			const store = createGameStore(initialState);

			store.update((state) => ({ ...state, score: state.score + 10 }));

			expect(store.get().score).toBe(10);
		});

		it('should receive current state in updater', () => {
			const store = createGameStore(initialState);

			store.update((state) => {
				expect(state).toEqual(initialState);
				return { ...state, level: 2 };
			});

			expect(store.get().level).toBe(2);
		});

		it('should allow multiple updates', () => {
			const store = createGameStore(initialState);

			store.update((s) => ({ ...s, score: 10 }));
			store.update((s) => ({ ...s, score: s.score + 5 }));
			store.update((s) => ({ ...s, lives: s.lives - 1 }));

			expect(store.get().score).toBe(15);
			expect(store.get().lives).toBe(2);
		});
	});

	describe('patch', () => {
		it('should partially update state', () => {
			const store = createGameStore(initialState);

			store.patch({ score: 100 });

			expect(store.get().score).toBe(100);
			expect(store.get().level).toBe(1); // unchanged
		});

		it('should merge nested objects shallowly', () => {
			const store = createGameStore(initialState);

			store.patch({ inventory: ['sword', 'shield'] });

			expect(store.get().inventory).toEqual(['sword', 'shield']);
		});

		it('should allow multiple partial updates', () => {
			const store = createGameStore(initialState);

			store.patch({ score: 50 });
			store.patch({ level: 3 });

			expect(store.get().score).toBe(50);
			expect(store.get().level).toBe(3);
		});
	});

	describe('reset', () => {
		it('should reset to initial state', () => {
			const store = createGameStore(initialState);

			store.patch({ score: 999, level: 99, lives: 0 });
			store.reset();

			expect(store.get()).toEqual(initialState);
		});

		it('should notify subscribers', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			store.subscribe(callback);
			store.patch({ score: 100 });
			callback.mockClear();

			store.reset();

			expect(callback).toHaveBeenCalled();
		});
	});

	describe('subscribe', () => {
		it('should call subscriber immediately with current state', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			store.subscribe(callback);

			expect(callback).toHaveBeenCalledWith(initialState);
		});

		it('should call subscriber on state changes', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			store.subscribe(callback);
			callback.mockClear();

			store.patch({ score: 50 });

			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith(expect.objectContaining({ score: 50 }));
		});

		it('should return unsubscribe function', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			const unsubscribe = store.subscribe(callback);
			callback.mockClear();

			unsubscribe();
			store.patch({ score: 100 });

			expect(callback).not.toHaveBeenCalled();
		});

		it('should support multiple subscribers', () => {
			const store = createGameStore(initialState);
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			store.subscribe(callback1);
			store.subscribe(callback2);
			callback1.mockClear();
			callback2.mockClear();

			store.patch({ score: 25 });

			expect(callback1).toHaveBeenCalled();
			expect(callback2).toHaveBeenCalled();
		});
	});

	describe('select (derived state)', () => {
		it('should select a subset of state', () => {
			const store = createGameStore(initialState);

			const score = store.select((s) => s.score);

			expect(score).toBe(0);
		});

		it('should return updated value after change', () => {
			const store = createGameStore(initialState);

			store.patch({ score: 42 });
			const score = store.select((s) => s.score);

			expect(score).toBe(42);
		});

		it('should support computed values', () => {
			const store = createGameStore(initialState);

			store.patch({ lives: 2, score: 100 });
			const isAlive = store.select((s) => s.lives > 0);
			const hasHighScore = store.select((s) => s.score >= 100);

			expect(isAlive).toBe(true);
			expect(hasHighScore).toBe(true);
		});
	});

	describe('subscribeToKey', () => {
		it('should only notify when specific key changes', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			store.subscribeToKey('score', callback);
			callback.mockClear();

			store.patch({ level: 5 }); // Should not trigger
			expect(callback).not.toHaveBeenCalled();

			store.patch({ score: 100 }); // Should trigger
			expect(callback).toHaveBeenCalledWith(100);
		});

		it('should call immediately with current value', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			store.subscribeToKey('lives', callback);

			expect(callback).toHaveBeenCalledWith(3);
		});

		it('should return unsubscribe function', () => {
			const store = createGameStore(initialState);
			const callback = vi.fn();

			const unsubscribe = store.subscribeToKey('score', callback);
			callback.mockClear();

			unsubscribe();
			store.patch({ score: 999 });

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('type safety', () => {
		it('should enforce correct types on patch', () => {
			const store = createGameStore(initialState);

			// This should work
			store.patch({ score: 100 });

			// TypeScript would catch this at compile time:
			// store.patch({ score: 'invalid' }); // Error: string not assignable to number
		});

		it('should enforce correct types on set', () => {
			const store = createGameStore(initialState);

			// This should work
			store.set({
				score: 100,
				level: 2,
				lives: 3,
				playerName: 'Test',
				inventory: []
			});
		});
	});
});
