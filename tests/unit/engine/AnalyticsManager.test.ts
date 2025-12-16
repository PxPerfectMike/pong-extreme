import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createAnalyticsManager,
	type AnalyticsManager,
	type AnalyticsProvider,
	type AnalyticsEvent
} from '$engine/analytics/AnalyticsManager';

describe('AnalyticsManager', () => {
	let manager: AnalyticsManager;

	beforeEach(() => {
		manager = createAnalyticsManager();
	});

	describe('createAnalyticsManager', () => {
		it('should create an analytics manager', () => {
			expect(manager).toBeDefined();
			expect(typeof manager.track).toBe('function');
			expect(typeof manager.setProvider).toBe('function');
		});
	});

	describe('track', () => {
		it('should not throw without a provider', () => {
			expect(() => manager.track({ name: 'test_event' })).not.toThrow();
		});

		it('should pass event to provider', () => {
			const provider: AnalyticsProvider = {
				track: vi.fn()
			};
			manager.setProvider(provider);

			manager.track({ name: 'test_event', params: { score: 100 } });

			expect(provider.track).toHaveBeenCalledWith({
				name: 'test_event',
				params: { score: 100 }
			});
		});

		it('should handle events with no params', () => {
			const provider: AnalyticsProvider = {
				track: vi.fn()
			};
			manager.setProvider(provider);

			manager.track({ name: 'simple_event' });

			expect(provider.track).toHaveBeenCalledWith({ name: 'simple_event' });
		});
	});

	describe('setProvider', () => {
		it('should set a provider', () => {
			const provider: AnalyticsProvider = {
				track: vi.fn()
			};

			expect(() => manager.setProvider(provider)).not.toThrow();
		});

		it('should replace existing provider', () => {
			const provider1: AnalyticsProvider = { track: vi.fn() };
			const provider2: AnalyticsProvider = { track: vi.fn() };

			manager.setProvider(provider1);
			manager.setProvider(provider2);
			manager.track({ name: 'test' });

			expect(provider1.track).not.toHaveBeenCalled();
			expect(provider2.track).toHaveBeenCalled();
		});

		it('should allow null to disable provider', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };

			manager.setProvider(provider);
			manager.setProvider(null);
			manager.track({ name: 'test' });

			expect(provider.track).not.toHaveBeenCalled();
		});
	});

	describe('predefined events', () => {
		it('should have levelStart helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.levelStart(5);

			expect(provider.track).toHaveBeenCalledWith({
				name: 'level_start',
				params: { level: 5 }
			});
		});

		it('should have levelComplete helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.levelComplete(5, 1000, 3);

			expect(provider.track).toHaveBeenCalledWith({
				name: 'level_complete',
				params: { level: 5, score: 1000, stars: 3 }
			});
		});

		it('should have levelFail helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.levelFail(5, 'out_of_moves');

			expect(provider.track).toHaveBeenCalledWith({
				name: 'level_fail',
				params: { level: 5, reason: 'out_of_moves' }
			});
		});

		it('should have purchase helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.purchase('gem_pack', 4.99, 'USD');

			expect(provider.track).toHaveBeenCalledWith({
				name: 'purchase',
				params: { item: 'gem_pack', value: 4.99, currency: 'USD' }
			});
		});

		it('should have achievementUnlocked helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.achievementUnlocked('first_win');

			expect(provider.track).toHaveBeenCalledWith({
				name: 'achievement_unlocked',
				params: { achievement_id: 'first_win' }
			});
		});

		it('should have screenView helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.screenView('main_menu');

			expect(provider.track).toHaveBeenCalledWith({
				name: 'screen_view',
				params: { screen_name: 'main_menu' }
			});
		});

		it('should have tutorialBegin helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.tutorialBegin();

			expect(provider.track).toHaveBeenCalledWith({
				name: 'tutorial_begin',
				params: {}
			});
		});

		it('should have tutorialComplete helper', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			manager.tutorialComplete();

			expect(provider.track).toHaveBeenCalledWith({
				name: 'tutorial_complete',
				params: {}
			});
		});
	});

	describe('setUserId', () => {
		it('should call provider setUserId if available', () => {
			const provider: AnalyticsProvider = {
				track: vi.fn(),
				setUserId: vi.fn()
			};
			manager.setProvider(provider);

			manager.setUserId('user123');

			expect(provider.setUserId).toHaveBeenCalledWith('user123');
		});

		it('should not throw if provider has no setUserId', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			expect(() => manager.setUserId('user123')).not.toThrow();
		});
	});

	describe('setUserProperty', () => {
		it('should call provider setUserProperty if available', () => {
			const provider: AnalyticsProvider = {
				track: vi.fn(),
				setUserProperty: vi.fn()
			};
			manager.setProvider(provider);

			manager.setUserProperty('premium', true);

			expect(provider.setUserProperty).toHaveBeenCalledWith('premium', true);
		});
	});

	describe('isEnabled', () => {
		it('should return true when provider is set', () => {
			const provider: AnalyticsProvider = { track: vi.fn() };
			manager.setProvider(provider);

			expect(manager.isEnabled()).toBe(true);
		});

		it('should return false when no provider', () => {
			expect(manager.isEnabled()).toBe(false);
		});
	});

	describe('debug mode', () => {
		it('should log events in debug mode', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			manager.setDebug(true);

			manager.track({ name: 'debug_test' });

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should not log when debug is off', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			manager.track({ name: 'test' });

			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
