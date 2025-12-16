import { describe, it, expect } from 'vitest';
import {
	linear,
	easeInQuad,
	easeOutQuad,
	easeInOutQuad,
	easeInCubic,
	easeOutCubic,
	easeInOutCubic,
	easeInQuart,
	easeOutQuart,
	easeInOutQuart,
	easeInQuint,
	easeOutQuint,
	easeInOutQuint,
	easeInBack,
	easeOutBack,
	easeInOutBack,
	easeOutBounce,
	easeInBounce,
	easeInOutBounce,
	easeOutElastic,
	easeInElastic,
	easeInOutElastic
} from '$engine/tween/easings';

describe('easings', () => {
	// Test all easings for basic properties
	const easings = {
		linear,
		easeInQuad,
		easeOutQuad,
		easeInOutQuad,
		easeInCubic,
		easeOutCubic,
		easeInOutCubic,
		easeInQuart,
		easeOutQuart,
		easeInOutQuart,
		easeInQuint,
		easeOutQuint,
		easeInOutQuint,
		easeInBack,
		easeOutBack,
		easeInOutBack,
		easeOutBounce,
		easeInBounce,
		easeInOutBounce,
		easeOutElastic,
		easeInElastic,
		easeInOutElastic
	};

	Object.entries(easings).forEach(([name, easing]) => {
		describe(name, () => {
			it('should return 0 when t = 0', () => {
				expect(easing(0)).toBeCloseTo(0, 2);
			});

			it('should return 1 when t = 1', () => {
				expect(easing(1)).toBeCloseTo(1, 2);
			});

			it('should return values for t between 0 and 1', () => {
				const result = easing(0.5);
				expect(typeof result).toBe('number');
				expect(isNaN(result)).toBe(false);
			});
		});
	});

	describe('linear', () => {
		it('should return input value unchanged', () => {
			expect(linear(0)).toBe(0);
			expect(linear(0.25)).toBe(0.25);
			expect(linear(0.5)).toBe(0.5);
			expect(linear(0.75)).toBe(0.75);
			expect(linear(1)).toBe(1);
		});
	});

	describe('easeInQuad', () => {
		it('should start slow and accelerate', () => {
			expect(easeInQuad(0.25)).toBeLessThan(0.25);
			expect(easeInQuad(0.5)).toBeLessThan(0.5);
			expect(easeInQuad(0.75)).toBeLessThan(0.75);
		});
	});

	describe('easeOutQuad', () => {
		it('should start fast and decelerate', () => {
			expect(easeOutQuad(0.25)).toBeGreaterThan(0.25);
			expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
			expect(easeOutQuad(0.75)).toBeGreaterThan(0.75);
		});
	});

	describe('easeInOutQuad', () => {
		it('should be symmetric around 0.5', () => {
			expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 2);
		});

		it('should be slow at start and end, fast in middle', () => {
			expect(easeInOutQuad(0.25)).toBeLessThan(0.25);
			expect(easeInOutQuad(0.75)).toBeGreaterThan(0.75);
		});
	});

	describe('easeInBack', () => {
		it('should overshoot slightly at the beginning (negative values)', () => {
			// easeInBack goes negative before reaching the target
			expect(easeInBack(0.2)).toBeLessThan(0);
		});
	});

	describe('easeOutBack', () => {
		it('should overshoot at the end (values > 1)', () => {
			// easeOutBack exceeds 1 before settling
			expect(easeOutBack(0.8)).toBeGreaterThan(1);
		});
	});

	describe('easeOutBounce', () => {
		it('should return values between 0 and 1 for most inputs', () => {
			for (let t = 0; t <= 1; t += 0.1) {
				const result = easeOutBounce(t);
				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThanOrEqual(1.001); // Small tolerance
			}
		});
	});

	describe('easeOutElastic', () => {
		it('should overshoot and oscillate', () => {
			// Elastic easing oscillates around the target
			const values = [0.3, 0.5, 0.7, 0.9].map(easeOutElastic);
			// Should have some variation
			expect(new Set(values.map(v => Math.round(v * 10))).size).toBeGreaterThan(1);
		});
	});
});
