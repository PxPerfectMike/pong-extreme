import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createAchievementManager,
	type AchievementManager,
	type AchievementDefinition
} from '$engine/achievements/AchievementManager';

describe('AchievementManager', () => {
	const achievements: AchievementDefinition[] = [
		{ id: 'first_win', name: 'First Victory', description: 'Win your first game' },
		{ id: 'score_100', name: 'Century', description: 'Score 100 points' },
		{ id: 'play_10', name: 'Dedicated', description: 'Play 10 games' }
	];

	let manager: AchievementManager;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(localStorage.getItem).mockReturnValue(null);
		manager = createAchievementManager(achievements, 'test-achievements');
	});

	describe('createAchievementManager', () => {
		it('should create manager with achievement definitions', () => {
			expect(manager).toBeDefined();
			expect(typeof manager.unlock).toBe('function');
			expect(typeof manager.isUnlocked).toBe('function');
		});

		it('should throw if no achievements provided', () => {
			expect(() => createAchievementManager([], 'test')).toThrow();
		});
	});

	describe('getAll', () => {
		it('should return all achievements', () => {
			const all = manager.getAll();

			expect(all).toHaveLength(3);
			expect(all[0].id).toBe('first_win');
			expect(all[1].id).toBe('score_100');
		});

		it('should include unlocked status', () => {
			const all = manager.getAll();

			all.forEach((a) => {
				expect(typeof a.unlocked).toBe('boolean');
			});
		});
	});

	describe('getById', () => {
		it('should return achievement by id', () => {
			const achievement = manager.getById('first_win');

			expect(achievement?.name).toBe('First Victory');
		});

		it('should return undefined for unknown id', () => {
			const achievement = manager.getById('unknown');

			expect(achievement).toBeUndefined();
		});
	});

	describe('isUnlocked', () => {
		it('should return false for locked achievement', () => {
			expect(manager.isUnlocked('first_win')).toBe(false);
		});

		it('should return true for unlocked achievement', () => {
			manager.unlock('first_win');
			expect(manager.isUnlocked('first_win')).toBe(true);
		});

		it('should return false for unknown achievement', () => {
			expect(manager.isUnlocked('unknown')).toBe(false);
		});
	});

	describe('unlock', () => {
		it('should unlock an achievement', () => {
			manager.unlock('first_win');

			expect(manager.isUnlocked('first_win')).toBe(true);
		});

		it('should return true on first unlock', () => {
			const result = manager.unlock('first_win');

			expect(result).toBe(true);
		});

		it('should return false if already unlocked', () => {
			manager.unlock('first_win');
			const result = manager.unlock('first_win');

			expect(result).toBe(false);
		});

		it('should return false for unknown achievement', () => {
			const result = manager.unlock('unknown');

			expect(result).toBe(false);
		});

		it('should set unlockedAt timestamp', () => {
			const before = Date.now();
			manager.unlock('first_win');
			const after = Date.now();

			const achievement = manager.getById('first_win');
			expect(achievement?.unlockedAt).toBeGreaterThanOrEqual(before);
			expect(achievement?.unlockedAt).toBeLessThanOrEqual(after);
		});

		it('should persist to storage', () => {
			manager.unlock('first_win');

			expect(localStorage.setItem).toHaveBeenCalled();
		});
	});

	describe('lock', () => {
		it('should lock an unlocked achievement', () => {
			manager.unlock('first_win');
			manager.lock('first_win');

			expect(manager.isUnlocked('first_win')).toBe(false);
		});

		it('should do nothing for already locked achievement', () => {
			manager.lock('first_win');

			expect(manager.isUnlocked('first_win')).toBe(false);
		});
	});

	describe('reset', () => {
		it('should lock all achievements', () => {
			manager.unlock('first_win');
			manager.unlock('score_100');
			manager.reset();

			expect(manager.isUnlocked('first_win')).toBe(false);
			expect(manager.isUnlocked('score_100')).toBe(false);
		});

		it('should clear storage', () => {
			manager.unlock('first_win');
			vi.mocked(localStorage.removeItem).mockClear();

			manager.reset();

			expect(localStorage.removeItem).toHaveBeenCalled();
		});
	});

	describe('getProgress', () => {
		it('should return 0 when no achievements unlocked', () => {
			const progress = manager.getProgress();

			expect(progress.unlocked).toBe(0);
			expect(progress.total).toBe(3);
			expect(progress.percentage).toBe(0);
		});

		it('should track unlocked count', () => {
			manager.unlock('first_win');
			manager.unlock('score_100');

			const progress = manager.getProgress();

			expect(progress.unlocked).toBe(2);
			expect(progress.total).toBe(3);
			expect(progress.percentage).toBeCloseTo(66.67, 0);
		});

		it('should return 100% when all unlocked', () => {
			manager.unlock('first_win');
			manager.unlock('score_100');
			manager.unlock('play_10');

			const progress = manager.getProgress();

			expect(progress.percentage).toBe(100);
		});
	});

	describe('onUnlock', () => {
		it('should notify when achievement is unlocked', () => {
			const callback = vi.fn();
			manager.onUnlock(callback);

			manager.unlock('first_win');

			expect(callback).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'first_win',
					name: 'First Victory'
				})
			);
		});

		it('should not notify for duplicate unlocks', () => {
			const callback = vi.fn();
			manager.onUnlock(callback);

			manager.unlock('first_win');
			manager.unlock('first_win');

			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should return unsubscribe function', () => {
			const callback = vi.fn();
			const unsubscribe = manager.onUnlock(callback);

			unsubscribe();
			manager.unlock('first_win');

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('persistence', () => {
		it('should load unlocked achievements from storage', () => {
			vi.mocked(localStorage.getItem).mockReturnValue(
				JSON.stringify({
					first_win: { unlockedAt: Date.now() }
				})
			);

			const newManager = createAchievementManager(achievements, 'test-achievements');

			expect(newManager.isUnlocked('first_win')).toBe(true);
			expect(newManager.isUnlocked('score_100')).toBe(false);
		});
	});

	describe('getUnlocked', () => {
		it('should return only unlocked achievements', () => {
			manager.unlock('first_win');

			const unlocked = manager.getUnlocked();

			expect(unlocked).toHaveLength(1);
			expect(unlocked[0].id).toBe('first_win');
		});

		it('should return empty array when none unlocked', () => {
			const unlocked = manager.getUnlocked();

			expect(unlocked).toHaveLength(0);
		});
	});

	describe('getLocked', () => {
		it('should return only locked achievements', () => {
			manager.unlock('first_win');

			const locked = manager.getLocked();

			expect(locked).toHaveLength(2);
			expect(locked.find((a) => a.id === 'first_win')).toBeUndefined();
		});
	});
});
