/**
 * Migration function that transforms data from one version to the next.
 */
export interface Migration {
	/** Target version this migration upgrades to */
	version: number;
	/** Migration function that transforms data */
	migrate: (data: unknown) => unknown;
}

/**
 * Options for creating a save manager.
 */
export interface SaveManagerOptions<T> {
	/** Current save data version */
	version?: number;
	/** Array of migrations for upgrading old saves */
	migrations?: Migration[];
	/** Called after data is saved */
	onSave?: (data: T) => void;
	/** Called after data is loaded */
	onLoad?: (data: T) => void;
}

/**
 * Internal save data structure with metadata.
 */
interface SaveWrapper<T> {
	version: number;
	timestamp: number;
	data: T;
}

/**
 * Save manager interface for persistent game data.
 */
export interface SaveManager<T> {
	/** Save data to storage */
	save(data: T): void;
	/** Load data from storage (returns null if not found or invalid) */
	load(): T | null;
	/** Load data or return default if not found */
	loadOrDefault(defaultData: T): T;
	/** Clear saved data */
	clear(): void;
	/** Check if save data exists */
	exists(): boolean;
	/** Get current version */
	getVersion(): number;
	/** Get version from saved data (null if no save) */
	getSavedVersion(): number | null;
	/** Get timestamp from saved data (null if no save) */
	getTimestamp(): number | null;
}

/**
 * Create a save manager for persistent game data with versioning and migrations.
 *
 * @param storageKey - LocalStorage key for this save
 * @param options - Configuration options
 * @returns Save manager instance
 *
 * @example
 * ```typescript
 * interface MySaveData {
 *   score: number;
 *   level: number;
 * }
 *
 * const saveManager = createSaveManager<MySaveData>('my-game-save', {
 *   version: 2,
 *   migrations: [
 *     {
 *       version: 2,
 *       migrate: (data) => ({ ...data, newField: 'default' })
 *     }
 *   ]
 * });
 *
 * // Save
 * saveManager.save({ score: 100, level: 5 });
 *
 * // Load
 * const data = saveManager.loadOrDefault({ score: 0, level: 1 });
 * ```
 */
export function createSaveManager<T>(
	storageKey: string,
	options: SaveManagerOptions<T> = {}
): SaveManager<T> {
	const { version = 1, migrations = [], onSave, onLoad } = options;

	// Sort migrations by version (ascending)
	const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

	function getRawSave(): SaveWrapper<T> | null {
		if (typeof localStorage === 'undefined') return null;

		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) return null;
			return JSON.parse(raw) as SaveWrapper<T>;
		} catch {
			return null;
		}
	}

	function applyMigrations(wrapper: SaveWrapper<unknown>): T | null {
		let data = wrapper.data;
		let currentVersion = wrapper.version;

		try {
			for (const migration of sortedMigrations) {
				if (migration.version > currentVersion) {
					data = migration.migrate(data);
					currentVersion = migration.version;
				}
			}
			return data as T;
		} catch {
			// Migration failed
			return null;
		}
	}

	return {
		save(data: T): void {
			if (typeof localStorage === 'undefined') return;

			const wrapper: SaveWrapper<T> = {
				version,
				timestamp: Date.now(),
				data
			};

			localStorage.setItem(storageKey, JSON.stringify(wrapper));
			onSave?.(data);
		},

		load(): T | null {
			const wrapper = getRawSave();
			if (!wrapper) return null;

			// Check if migrations are needed
			if (wrapper.version < version) {
				const migrated = applyMigrations(wrapper as SaveWrapper<unknown>);
				if (migrated) {
					onLoad?.(migrated);
				}
				return migrated;
			}

			onLoad?.(wrapper.data);
			return wrapper.data;
		},

		loadOrDefault(defaultData: T): T {
			const loaded = this.load();
			return loaded ?? defaultData;
		},

		clear(): void {
			if (typeof localStorage === 'undefined') return;
			localStorage.removeItem(storageKey);
		},

		exists(): boolean {
			return getRawSave() !== null;
		},

		getVersion(): number {
			return version;
		},

		getSavedVersion(): number | null {
			const wrapper = getRawSave();
			return wrapper?.version ?? null;
		},

		getTimestamp(): number | null {
			const wrapper = getRawSave();
			return wrapper?.timestamp ?? null;
		}
	};
}
