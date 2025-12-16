/**
 * Achievement definition (static data).
 */
export interface AchievementDefinition {
	/** Unique achievement ID */
	id: string;
	/** Display name */
	name: string;
	/** Description of how to unlock */
	description: string;
	/** Optional icon */
	icon?: string;
	/** Optional point value */
	points?: number;
	/** Whether this achievement is hidden until unlocked */
	hidden?: boolean;
}

/**
 * Achievement state (runtime data).
 */
export interface Achievement extends AchievementDefinition {
	/** Whether this achievement is unlocked */
	unlocked: boolean;
	/** Timestamp when unlocked (undefined if locked) */
	unlockedAt?: number;
}

/**
 * Progress tracking.
 */
export interface AchievementProgress {
	unlocked: number;
	total: number;
	percentage: number;
}

/**
 * Persisted achievement data.
 */
interface PersistedAchievement {
	unlockedAt: number;
}

/**
 * Achievement manager interface.
 */
export interface AchievementManager {
	/** Get all achievements */
	getAll(): Achievement[];
	/** Get achievement by ID */
	getById(id: string): Achievement | undefined;
	/** Check if achievement is unlocked */
	isUnlocked(id: string): boolean;
	/** Unlock an achievement (returns true if newly unlocked) */
	unlock(id: string): boolean;
	/** Lock an achievement */
	lock(id: string): void;
	/** Reset all achievements */
	reset(): void;
	/** Get progress stats */
	getProgress(): AchievementProgress;
	/** Get only unlocked achievements */
	getUnlocked(): Achievement[];
	/** Get only locked achievements */
	getLocked(): Achievement[];
	/** Subscribe to unlock events */
	onUnlock(callback: (achievement: Achievement) => void): () => void;
}

/**
 * Create an achievement manager.
 *
 * @param definitions - Achievement definitions
 * @param storageKey - LocalStorage key for persistence
 * @returns Achievement manager instance
 */
export function createAchievementManager(
	definitions: AchievementDefinition[],
	storageKey: string
): AchievementManager {
	if (definitions.length === 0) {
		throw new Error('At least one achievement must be defined');
	}

	const achievementMap = new Map<string, Achievement>();
	const unlockCallbacks = new Set<(achievement: Achievement) => void>();

	// Initialize from definitions
	definitions.forEach((def) => {
		achievementMap.set(def.id, {
			...def,
			unlocked: false,
			unlockedAt: undefined
		});
	});

	// Load persisted state
	function loadFromStorage(): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) return;

			const persisted: Record<string, PersistedAchievement> = JSON.parse(raw);

			Object.entries(persisted).forEach(([id, data]) => {
				const achievement = achievementMap.get(id);
				if (achievement) {
					achievement.unlocked = true;
					achievement.unlockedAt = data.unlockedAt;
				}
			});
		} catch {
			// Invalid data, ignore
		}
	}

	// Save to storage
	function saveToStorage(): void {
		if (typeof localStorage === 'undefined') return;

		const persisted: Record<string, PersistedAchievement> = {};

		achievementMap.forEach((achievement, id) => {
			if (achievement.unlocked && achievement.unlockedAt) {
				persisted[id] = { unlockedAt: achievement.unlockedAt };
			}
		});

		localStorage.setItem(storageKey, JSON.stringify(persisted));
	}

	// Load on initialization
	loadFromStorage();

	return {
		getAll(): Achievement[] {
			return Array.from(achievementMap.values());
		},

		getById(id: string): Achievement | undefined {
			return achievementMap.get(id);
		},

		isUnlocked(id: string): boolean {
			return achievementMap.get(id)?.unlocked ?? false;
		},

		unlock(id: string): boolean {
			const achievement = achievementMap.get(id);
			if (!achievement) return false;
			if (achievement.unlocked) return false;

			achievement.unlocked = true;
			achievement.unlockedAt = Date.now();

			saveToStorage();

			// Notify listeners
			unlockCallbacks.forEach((cb) => cb({ ...achievement }));

			return true;
		},

		lock(id: string): void {
			const achievement = achievementMap.get(id);
			if (!achievement) return;

			achievement.unlocked = false;
			achievement.unlockedAt = undefined;

			saveToStorage();
		},

		reset(): void {
			achievementMap.forEach((achievement) => {
				achievement.unlocked = false;
				achievement.unlockedAt = undefined;
			});

			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem(storageKey);
			}
		},

		getProgress(): AchievementProgress {
			const all = this.getAll();
			const unlocked = all.filter((a) => a.unlocked).length;
			const total = all.length;
			const percentage = total > 0 ? (unlocked / total) * 100 : 0;

			return { unlocked, total, percentage };
		},

		getUnlocked(): Achievement[] {
			return this.getAll().filter((a) => a.unlocked);
		},

		getLocked(): Achievement[] {
			return this.getAll().filter((a) => !a.unlocked);
		},

		onUnlock(callback: (achievement: Achievement) => void): () => void {
			unlockCallbacks.add(callback);
			return () => unlockCallbacks.delete(callback);
		}
	};
}
