/**
 * Play Store hooks for Google Play integration.
 * These are interface stubs that can be wired up to Capacitor plugins
 * when wrapping the PWA for the Play Store.
 */

/**
 * Product information for in-app purchases.
 */
export interface Product {
	id: string;
	title: string;
	description: string;
	price: string;
	priceRaw: number;
	currency: string;
}

/**
 * Purchase result.
 */
export interface PurchaseResult {
	productId: string;
	transactionId: string;
	receipt: string;
}

/**
 * Leaderboard entry.
 */
export interface LeaderboardEntry {
	rank: number;
	playerId: string;
	playerName: string;
	score: number;
}

/**
 * Play Store hooks interface.
 */
export interface PlayStoreHooks {
	// In-App Purchases
	/** Get available products */
	getProducts(productIds: string[]): Promise<Product[]>;
	/** Purchase a product */
	purchase(productId: string): Promise<PurchaseResult>;
	/** Restore previous purchases */
	restorePurchases(): Promise<PurchaseResult[]>;
	/** Consume a purchase (for consumables) */
	consumePurchase(transactionId: string): Promise<void>;

	// Leaderboards
	/** Show native leaderboard UI */
	showLeaderboard(leaderboardId: string): Promise<void>;
	/** Submit score to leaderboard */
	submitScore(leaderboardId: string, score: number): Promise<void>;
	/** Get leaderboard entries */
	getLeaderboard(leaderboardId: string, count?: number): Promise<LeaderboardEntry[]>;

	// Achievements
	/** Show native achievements UI */
	showAchievements(): Promise<void>;
	/** Unlock achievement */
	unlockAchievement(achievementId: string): Promise<void>;
	/** Increment achievement progress */
	incrementAchievement(achievementId: string, steps: number): Promise<void>;

	// Sign-in
	/** Sign in with Google Play Games */
	signIn(): Promise<{ playerId: string; playerName: string }>;
	/** Sign out */
	signOut(): Promise<void>;
	/** Check if signed in */
	isSignedIn(): Promise<boolean>;
}

/**
 * Create stub Play Store hooks for web/PWA.
 * These return no-op implementations that can be replaced with
 * Capacitor plugin implementations when building for Play Store.
 *
 * @returns Stub Play Store hooks
 */
export function createPlayStoreHooks(): PlayStoreHooks {
	return {
		// In-App Purchases
		async getProducts(_productIds: string[]): Promise<Product[]> {
			console.warn('[PlayStoreHooks] getProducts not available in web mode');
			return [];
		},

		async purchase(_productId: string): Promise<PurchaseResult> {
			console.warn('[PlayStoreHooks] purchase not available in web mode');
			throw new Error('In-app purchases not available');
		},

		async restorePurchases(): Promise<PurchaseResult[]> {
			console.warn('[PlayStoreHooks] restorePurchases not available in web mode');
			return [];
		},

		async consumePurchase(_transactionId: string): Promise<void> {
			console.warn('[PlayStoreHooks] consumePurchase not available in web mode');
		},

		// Leaderboards
		async showLeaderboard(_leaderboardId: string): Promise<void> {
			console.warn('[PlayStoreHooks] showLeaderboard not available in web mode');
		},

		async submitScore(_leaderboardId: string, _score: number): Promise<void> {
			console.warn('[PlayStoreHooks] submitScore not available in web mode');
		},

		async getLeaderboard(_leaderboardId: string, _count?: number): Promise<LeaderboardEntry[]> {
			console.warn('[PlayStoreHooks] getLeaderboard not available in web mode');
			return [];
		},

		// Achievements
		async showAchievements(): Promise<void> {
			console.warn('[PlayStoreHooks] showAchievements not available in web mode');
		},

		async unlockAchievement(_achievementId: string): Promise<void> {
			console.warn('[PlayStoreHooks] unlockAchievement not available in web mode');
		},

		async incrementAchievement(_achievementId: string, _steps: number): Promise<void> {
			console.warn('[PlayStoreHooks] incrementAchievement not available in web mode');
		},

		// Sign-in
		async signIn(): Promise<{ playerId: string; playerName: string }> {
			console.warn('[PlayStoreHooks] signIn not available in web mode');
			throw new Error('Google Play Games sign-in not available');
		},

		async signOut(): Promise<void> {
			console.warn('[PlayStoreHooks] signOut not available in web mode');
		},

		async isSignedIn(): Promise<boolean> {
			return false;
		}
	};
}

/**
 * Check if running in a Capacitor native context.
 */
export function isNativeContext(): boolean {
	return typeof (window as any).Capacitor !== 'undefined';
}
