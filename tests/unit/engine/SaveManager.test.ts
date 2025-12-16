import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createSaveManager,
	type SaveManager,
	type Migration
} from '$engine/save/SaveManager';

interface TestSaveData {
	score: number;
	level: number;
	unlockedLevels: number[];
}

describe('SaveManager', () => {
	const storageKey = 'test-game-save';
	const defaultData: TestSaveData = {
		score: 0,
		level: 1,
		unlockedLevels: [1]
	};

	beforeEach(() => {
		// Clear localStorage mock before each test
		vi.mocked(localStorage.getItem).mockReturnValue(null);
		vi.mocked(localStorage.setItem).mockClear();
		vi.mocked(localStorage.removeItem).mockClear();
	});

	describe('createSaveManager', () => {
		it('should create a save manager with given key', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager).toBeDefined();
			expect(typeof manager.save).toBe('function');
			expect(typeof manager.load).toBe('function');
		});
	});

	describe('save', () => {
		it('should save data to localStorage', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);
			const data: TestSaveData = { score: 100, level: 5, unlockedLevels: [1, 2, 3] };

			manager.save(data);

			expect(localStorage.setItem).toHaveBeenCalledWith(
				storageKey,
				expect.stringContaining('"score":100')
			);
		});

		it('should include version in saved data', () => {
			const manager = createSaveManager<TestSaveData>(storageKey, { version: 2 });
			const data: TestSaveData = { score: 50, level: 2, unlockedLevels: [1, 2] };

			manager.save(data);

			const savedArg = vi.mocked(localStorage.setItem).mock.calls[0][1];
			const parsed = JSON.parse(savedArg);
			expect(parsed.version).toBe(2);
		});

		it('should include timestamp in saved data', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);
			const data: TestSaveData = { score: 0, level: 1, unlockedLevels: [1] };

			const before = Date.now();
			manager.save(data);
			const after = Date.now();

			const savedArg = vi.mocked(localStorage.setItem).mock.calls[0][1];
			const parsed = JSON.parse(savedArg);
			expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
			expect(parsed.timestamp).toBeLessThanOrEqual(after);
		});
	});

	describe('load', () => {
		it('should return null if no save exists', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			const result = manager.load();

			expect(result).toBeNull();
		});

		it('should load saved data from localStorage', () => {
			const savedData = {
				version: 1,
				timestamp: Date.now(),
				data: { score: 200, level: 10, unlockedLevels: [1, 2, 3, 4, 5] }
			};
			vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(savedData));

			const manager = createSaveManager<TestSaveData>(storageKey);
			const result = manager.load();

			expect(result).toEqual(savedData.data);
		});

		it('should return null if saved data is invalid JSON', () => {
			vi.mocked(localStorage.getItem).mockReturnValue('invalid json');

			const manager = createSaveManager<TestSaveData>(storageKey);
			const result = manager.load();

			expect(result).toBeNull();
		});
	});

	describe('loadOrDefault', () => {
		it('should return default if no save exists', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			const result = manager.loadOrDefault(defaultData);

			expect(result).toEqual(defaultData);
		});

		it('should return saved data if exists', () => {
			const savedData = {
				version: 1,
				timestamp: Date.now(),
				data: { score: 500, level: 20, unlockedLevels: [1, 2, 3] }
			};
			vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(savedData));

			const manager = createSaveManager<TestSaveData>(storageKey);
			const result = manager.loadOrDefault(defaultData);

			expect(result).toEqual(savedData.data);
		});
	});

	describe('clear', () => {
		it('should remove saved data from localStorage', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			manager.clear();

			expect(localStorage.removeItem).toHaveBeenCalledWith(storageKey);
		});
	});

	describe('exists', () => {
		it('should return false if no save exists', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.exists()).toBe(false);
		});

		it('should return true if save exists', () => {
			vi.mocked(localStorage.getItem).mockReturnValue('{"version":1,"data":{}}');

			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.exists()).toBe(true);
		});
	});

	describe('getVersion', () => {
		it('should return current version', () => {
			const manager = createSaveManager<TestSaveData>(storageKey, { version: 5 });

			expect(manager.getVersion()).toBe(5);
		});

		it('should default to version 1', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.getVersion()).toBe(1);
		});
	});

	describe('getSavedVersion', () => {
		it('should return null if no save exists', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.getSavedVersion()).toBeNull();
		});

		it('should return version from saved data', () => {
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({ version: 3, data: {} })
			);

			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.getSavedVersion()).toBe(3);
		});
	});

	describe('getTimestamp', () => {
		it('should return null if no save exists', () => {
			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.getTimestamp()).toBeNull();
		});

		it('should return timestamp from saved data', () => {
			const timestamp = 1234567890;
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({ version: 1, timestamp, data: {} })
			);

			const manager = createSaveManager<TestSaveData>(storageKey);

			expect(manager.getTimestamp()).toBe(timestamp);
		});
	});

	describe('migrations', () => {
		it('should apply migrations when loading older saves', () => {
			// Old save at version 1
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({
					version: 1,
					data: { score: 100, level: 5 } // Missing unlockedLevels
				})
			);

			const migrations: Migration[] = [
				{
					version: 2,
					migrate: (data: unknown) => {
						const d = data as { score: number; level: number };
						return {
							...d,
							unlockedLevels: Array.from({ length: d.level }, (_, i) => i + 1)
						};
					}
				}
			];

			const manager = createSaveManager<TestSaveData>(storageKey, {
				version: 2,
				migrations
			});
			const result = manager.load();

			expect(result?.unlockedLevels).toEqual([1, 2, 3, 4, 5]);
		});

		it('should apply multiple migrations in order', () => {
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({
					version: 1,
					data: { score: 50 }
				})
			);

			const migrations: Migration[] = [
				{
					version: 2,
					migrate: (data: unknown) => ({
						...(data as object),
						level: 1
					})
				},
				{
					version: 3,
					migrate: (data: unknown) => ({
						...(data as object),
						unlockedLevels: [1]
					})
				}
			];

			const manager = createSaveManager<TestSaveData>(storageKey, {
				version: 3,
				migrations
			});
			const result = manager.load();

			expect(result).toEqual({
				score: 50,
				level: 1,
				unlockedLevels: [1]
			});
		});

		it('should only apply migrations newer than saved version', () => {
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({
					version: 2,
					data: { score: 100, level: 3 }
				})
			);

			const migration1 = vi.fn((data: unknown) => ({ ...(data as object), v1Applied: true }));
			const migration2 = vi.fn((data: unknown) => ({ ...(data as object), v2Applied: true }));
			const migration3 = vi.fn((data: unknown) => ({ ...(data as object), unlockedLevels: [1] }));

			const migrations: Migration[] = [
				{ version: 2, migrate: migration2 },
				{ version: 3, migrate: migration3 }
			];

			const manager = createSaveManager<TestSaveData>(storageKey, {
				version: 3,
				migrations
			});
			manager.load();

			// Version 2 migration should NOT be called (save is already v2)
			expect(migration2).not.toHaveBeenCalled();
			// Version 3 migration should be called
			expect(migration3).toHaveBeenCalled();
		});

		it('should handle migration errors gracefully', () => {
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({
					version: 1,
					data: { score: 100 }
				})
			);

			const migrations: Migration[] = [
				{
					version: 2,
					migrate: () => {
						throw new Error('Migration failed');
					}
				}
			];

			const manager = createSaveManager<TestSaveData>(storageKey, {
				version: 2,
				migrations
			});

			// Should return null on migration error
			expect(manager.load()).toBeNull();
		});
	});

	describe('onSave / onLoad hooks', () => {
		it('should call onSave hook after saving', () => {
			const onSave = vi.fn();
			const manager = createSaveManager<TestSaveData>(storageKey, { onSave });
			const data: TestSaveData = { score: 100, level: 1, unlockedLevels: [1] };

			manager.save(data);

			expect(onSave).toHaveBeenCalledWith(data);
		});

		it('should call onLoad hook after loading', () => {
			const savedData = {
				version: 1,
				timestamp: Date.now(),
				data: { score: 200, level: 5, unlockedLevels: [1, 2] }
			};
			vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(savedData));

			const onLoad = vi.fn();
			const manager = createSaveManager<TestSaveData>(storageKey, { onLoad });

			manager.load();

			expect(onLoad).toHaveBeenCalledWith(savedData.data);
		});
	});
});
