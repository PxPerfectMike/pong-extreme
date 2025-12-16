import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHapticManager, type HapticManager } from '$engine/haptics/HapticManager';

describe('HapticManager', () => {
	let manager: HapticManager;

	beforeEach(() => {
		vi.clearAllMocks();
		manager = createHapticManager();
	});

	describe('createHapticManager', () => {
		it('should create a haptic manager instance', () => {
			expect(manager).toBeDefined();
			expect(typeof manager.light).toBe('function');
			expect(typeof manager.medium).toBe('function');
			expect(typeof manager.heavy).toBe('function');
		});
	});

	describe('isSupported', () => {
		it('should return a boolean', () => {
			expect(typeof manager.isSupported()).toBe('boolean');
		});
	});

	describe('light', () => {
		it('should trigger light vibration', () => {
			manager.light();
			expect(navigator.vibrate).toHaveBeenCalledWith(expect.any(Number));
		});

		it('should use short duration', () => {
			manager.light();
			const arg = vi.mocked(navigator.vibrate).mock.calls[0][0];
			const duration = typeof arg === 'number' ? arg : 0;
			expect(duration).toBeLessThanOrEqual(50);
		});
	});

	describe('medium', () => {
		it('should trigger medium vibration', () => {
			manager.medium();
			expect(navigator.vibrate).toHaveBeenCalled();
		});

		it('should use medium duration', () => {
			manager.medium();
			const arg = vi.mocked(navigator.vibrate).mock.calls[0][0];
			const duration = typeof arg === 'number' ? arg : 0;
			expect(duration).toBeGreaterThan(20);
			expect(duration).toBeLessThanOrEqual(100);
		});
	});

	describe('heavy', () => {
		it('should trigger heavy vibration', () => {
			manager.heavy();
			expect(navigator.vibrate).toHaveBeenCalled();
		});

		it('should use longer duration', () => {
			manager.heavy();
			const arg = vi.mocked(navigator.vibrate).mock.calls[0][0];
			const duration = typeof arg === 'number' ? arg : 0;
			expect(duration).toBeGreaterThanOrEqual(50);
		});
	});

	describe('pattern', () => {
		it('should trigger vibration pattern', () => {
			const pattern = [100, 50, 100];
			manager.pattern(pattern);
			expect(navigator.vibrate).toHaveBeenCalledWith(pattern);
		});
	});

	describe('stop', () => {
		it('should stop vibration', () => {
			manager.stop();
			expect(navigator.vibrate).toHaveBeenCalledWith(0);
		});
	});

	describe('setEnabled', () => {
		it('should enable/disable haptics', () => {
			manager.setEnabled(false);
			manager.light();

			// When disabled, vibrate should not be called (or called with 0)
			expect(manager.isEnabled()).toBe(false);
		});

		it('should allow re-enabling', () => {
			manager.setEnabled(false);
			manager.setEnabled(true);
			expect(manager.isEnabled()).toBe(true);
		});
	});

	describe('isEnabled', () => {
		it('should return true by default', () => {
			expect(manager.isEnabled()).toBe(true);
		});
	});

	describe('tap', () => {
		it('should trigger tap feedback', () => {
			manager.tap();
			expect(navigator.vibrate).toHaveBeenCalled();
		});
	});

	describe('success', () => {
		it('should trigger success feedback pattern', () => {
			manager.success();
			expect(navigator.vibrate).toHaveBeenCalled();
		});
	});

	describe('error', () => {
		it('should trigger error feedback pattern', () => {
			manager.error();
			expect(navigator.vibrate).toHaveBeenCalled();
		});
	});

	describe('when disabled', () => {
		beforeEach(() => {
			manager.setEnabled(false);
			vi.clearAllMocks();
		});

		it('should not vibrate on light()', () => {
			manager.light();
			expect(navigator.vibrate).not.toHaveBeenCalled();
		});

		it('should not vibrate on medium()', () => {
			manager.medium();
			expect(navigator.vibrate).not.toHaveBeenCalled();
		});

		it('should not vibrate on heavy()', () => {
			manager.heavy();
			expect(navigator.vibrate).not.toHaveBeenCalled();
		});
	});
});
