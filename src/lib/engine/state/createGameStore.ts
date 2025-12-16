/**
 * Subscriber callback type for the game store.
 */
type Subscriber<T> = (state: T) => void;

/**
 * Key subscriber callback type.
 */
type KeySubscriber<T, K extends keyof T> = (value: T[K]) => void;

/**
 * Updater function type.
 */
type Updater<T> = (state: T) => T;

/**
 * Game store interface with type-safe state management.
 */
export interface GameStore<T extends object> {
	/** Get current state snapshot */
	get(): T;
	/** Replace entire state */
	set(state: T): void;
	/** Update state via function */
	update(updater: Updater<T>): void;
	/** Partially update state */
	patch(partial: Partial<T>): void;
	/** Reset to initial state */
	reset(): void;
	/** Subscribe to all state changes */
	subscribe(callback: Subscriber<T>): () => void;
	/** Select and return a derived value */
	select<R>(selector: (state: T) => R): R;
	/** Subscribe to changes on a specific key */
	subscribeToKey<K extends keyof T>(key: K, callback: KeySubscriber<T, K>): () => void;
}

/**
 * Deep clone an object (simple implementation for game state).
 */
function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a typed game state store with reactive updates.
 *
 * @param initialState - Initial state object
 * @returns Game store instance
 *
 * @example
 * ```typescript
 * interface MyGameState {
 *   score: number;
 *   level: number;
 *   lives: number;
 * }
 *
 * const gameStore = createGameStore<MyGameState>({
 *   score: 0,
 *   level: 1,
 *   lives: 3
 * });
 *
 * // Update score
 * gameStore.patch({ score: 100 });
 *
 * // Subscribe to changes
 * gameStore.subscribe((state) => console.log('State changed:', state));
 * ```
 */
export function createGameStore<T extends object>(initialState: T): GameStore<T> {
	// Store a deep clone of initial state for reset
	const initial = deepClone(initialState);
	let state = deepClone(initialState);

	const subscribers = new Set<Subscriber<T>>();
	const keySubscribers = new Map<keyof T, Set<KeySubscriber<T, keyof T>>>();

	function notify() {
		const snapshot = deepClone(state);
		subscribers.forEach((cb) => cb(snapshot));
	}

	function notifyKeySubscribers(changedKeys: Set<keyof T>) {
		changedKeys.forEach((key) => {
			const subs = keySubscribers.get(key);
			if (subs) {
				const value = state[key];
				subs.forEach((cb) => cb(value));
			}
		});
	}

	function getChangedKeys(oldState: T, newState: T): Set<keyof T> {
		const changed = new Set<keyof T>();
		const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]) as Set<keyof T>;

		allKeys.forEach((key) => {
			if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
				changed.add(key);
			}
		});

		return changed;
	}

	return {
		get(): T {
			return deepClone(state);
		},

		set(newState: T): void {
			const oldState = state;
			state = deepClone(newState);
			notify();
			notifyKeySubscribers(getChangedKeys(oldState, state));
		},

		update(updater: Updater<T>): void {
			const oldState = state;
			state = deepClone(updater(deepClone(state)));
			notify();
			notifyKeySubscribers(getChangedKeys(oldState, state));
		},

		patch(partial: Partial<T>): void {
			const oldState = state;
			state = { ...state, ...deepClone(partial) };
			notify();
			notifyKeySubscribers(getChangedKeys(oldState, state));
		},

		reset(): void {
			const oldState = state;
			state = deepClone(initial);
			notify();
			notifyKeySubscribers(getChangedKeys(oldState, state));
		},

		subscribe(callback: Subscriber<T>): () => void {
			subscribers.add(callback);
			callback(deepClone(state)); // Immediate call with current state
			return () => {
				subscribers.delete(callback);
			};
		},

		select<R>(selector: (state: T) => R): R {
			return selector(deepClone(state));
		},

		subscribeToKey<K extends keyof T>(key: K, callback: KeySubscriber<T, K>): () => void {
			if (!keySubscribers.has(key)) {
				keySubscribers.set(key, new Set());
			}
			const subs = keySubscribers.get(key)!;
			subs.add(callback as KeySubscriber<T, keyof T>);

			// Immediate call with current value
			callback(state[key]);

			return () => {
				subs.delete(callback as KeySubscriber<T, keyof T>);
			};
		}
	};
}

/**
 * Create a Svelte-compatible store from a game store.
 * This allows using the store with Svelte's $ syntax.
 */
export function createSvelteGameStore<T extends object>(initialState: T) {
	const store = createGameStore(initialState);

	return {
		...store,
		// Svelte store contract
		subscribe: store.subscribe
	};
}
