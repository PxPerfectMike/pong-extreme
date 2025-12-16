/**
 * Analytics event to track.
 */
export interface AnalyticsEvent {
	/** Event name */
	name: string;
	/** Optional event parameters */
	params?: Record<string, unknown>;
}

/**
 * Analytics provider interface (plug in any analytics SDK).
 */
export interface AnalyticsProvider {
	/** Track an event */
	track(event: AnalyticsEvent): void;
	/** Set user ID (optional) */
	setUserId?(userId: string): void;
	/** Set user property (optional) */
	setUserProperty?(name: string, value: unknown): void;
}

/**
 * Analytics manager interface.
 */
export interface AnalyticsManager {
	/** Track a custom event */
	track(event: AnalyticsEvent): void;
	/** Set the analytics provider */
	setProvider(provider: AnalyticsProvider | null): void;
	/** Check if analytics is enabled */
	isEnabled(): boolean;
	/** Enable debug logging */
	setDebug(enabled: boolean): void;
	/** Set user ID */
	setUserId(userId: string): void;
	/** Set user property */
	setUserProperty(name: string, value: unknown): void;

	// Predefined game events
	/** Track level start */
	levelStart(level: number): void;
	/** Track level complete */
	levelComplete(level: number, score: number, stars?: number): void;
	/** Track level fail */
	levelFail(level: number, reason?: string): void;
	/** Track purchase */
	purchase(item: string, value: number, currency: string): void;
	/** Track achievement unlocked */
	achievementUnlocked(achievementId: string): void;
	/** Track screen view */
	screenView(screenName: string): void;
	/** Track tutorial begin */
	tutorialBegin(): void;
	/** Track tutorial complete */
	tutorialComplete(): void;
}

/**
 * Create an analytics manager.
 *
 * @returns Analytics manager instance
 */
export function createAnalyticsManager(): AnalyticsManager {
	let provider: AnalyticsProvider | null = null;
	let debug = false;

	function trackEvent(event: AnalyticsEvent): void {
		if (debug) {
			console.log('[Analytics]', event.name, event.params || {});
		}

		provider?.track(event);
	}

	return {
		track(event: AnalyticsEvent): void {
			trackEvent(event);
		},

		setProvider(newProvider: AnalyticsProvider | null): void {
			provider = newProvider;
		},

		isEnabled(): boolean {
			return provider !== null;
		},

		setDebug(enabled: boolean): void {
			debug = enabled;
		},

		setUserId(userId: string): void {
			provider?.setUserId?.(userId);
		},

		setUserProperty(name: string, value: unknown): void {
			provider?.setUserProperty?.(name, value);
		},

		// Predefined game events

		levelStart(level: number): void {
			trackEvent({
				name: 'level_start',
				params: { level }
			});
		},

		levelComplete(level: number, score: number, stars?: number): void {
			trackEvent({
				name: 'level_complete',
				params: { level, score, stars }
			});
		},

		levelFail(level: number, reason?: string): void {
			trackEvent({
				name: 'level_fail',
				params: { level, reason }
			});
		},

		purchase(item: string, value: number, currency: string): void {
			trackEvent({
				name: 'purchase',
				params: { item, value, currency }
			});
		},

		achievementUnlocked(achievementId: string): void {
			trackEvent({
				name: 'achievement_unlocked',
				params: { achievement_id: achievementId }
			});
		},

		screenView(screenName: string): void {
			trackEvent({
				name: 'screen_view',
				params: { screen_name: screenName }
			});
		},

		tutorialBegin(): void {
			trackEvent({
				name: 'tutorial_begin',
				params: {}
			});
		},

		tutorialComplete(): void {
			trackEvent({
				name: 'tutorial_complete',
				params: {}
			});
		}
	};
}

/**
 * Create a console analytics provider for development/debugging.
 */
export function createConsoleAnalyticsProvider(): AnalyticsProvider {
	return {
		track(event: AnalyticsEvent): void {
			console.log(`[Analytics] ${event.name}`, event.params || {});
		},
		setUserId(userId: string): void {
			console.log(`[Analytics] User ID: ${userId}`);
		},
		setUserProperty(name: string, value: unknown): void {
			console.log(`[Analytics] User Property: ${name} = ${value}`);
		}
	};
}
