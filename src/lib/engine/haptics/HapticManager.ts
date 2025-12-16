/**
 * Haptic feedback manager interface.
 */
export interface HapticManager {
	/** Trigger light haptic feedback (short vibration) */
	light(): void;
	/** Trigger medium haptic feedback */
	medium(): void;
	/** Trigger heavy haptic feedback (long vibration) */
	heavy(): void;
	/** Trigger custom vibration pattern */
	pattern(pattern: number[]): void;
	/** Stop any ongoing vibration */
	stop(): void;
	/** Check if haptic feedback is supported */
	isSupported(): boolean;
	/** Enable or disable haptic feedback */
	setEnabled(enabled: boolean): void;
	/** Check if haptic feedback is enabled */
	isEnabled(): boolean;
	/** Trigger tap feedback (light, quick) */
	tap(): void;
	/** Trigger success feedback pattern */
	success(): void;
	/** Trigger error feedback pattern */
	error(): void;
}

/**
 * Create a haptic feedback manager.
 *
 * @returns Haptic manager instance
 */
export function createHapticManager(): HapticManager {
	let enabled = true;

	function vibrate(pattern: number | number[]): void {
		if (!enabled) return;
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			navigator.vibrate(pattern);
		}
	}

	return {
		light(): void {
			vibrate(10);
		},

		medium(): void {
			vibrate(50);
		},

		heavy(): void {
			vibrate(100);
		},

		pattern(pattern: number[]): void {
			vibrate(pattern);
		},

		stop(): void {
			if (typeof navigator !== 'undefined' && navigator.vibrate) {
				navigator.vibrate(0);
			}
		},

		isSupported(): boolean {
			return typeof navigator !== 'undefined' && 'vibrate' in navigator;
		},

		setEnabled(newEnabled: boolean): void {
			enabled = newEnabled;
		},

		isEnabled(): boolean {
			return enabled;
		},

		tap(): void {
			vibrate(5);
		},

		success(): void {
			vibrate([10, 50, 20]);
		},

		error(): void {
			vibrate([50, 30, 50, 30, 50]);
		}
	};
}
