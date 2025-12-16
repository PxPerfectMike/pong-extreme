import { describe, it, expect, beforeEach } from 'vitest';
import {
	calculateViewport,
	type ViewportConfig,
	type ViewportResult
} from '$engine/core/viewport';

describe('viewport', () => {
	const defaultConfig: ViewportConfig = {
		minAspect: 9 / 18, // 0.5 - tall phone
		maxAspect: 9 / 14, // ~0.64 - tablet-ish
		baseWidth: 100,
		baseHeight: 177.78 // 16:9 equivalent height at 100 width
	};

	describe('calculateViewport', () => {
		it('should return viewport dimensions for a screen within aspect bounds', () => {
			// Screen is 360x640 (9:16 = 0.5625), within our min/max bounds
			const result = calculateViewport(360, 640, defaultConfig);

			expect(result.width).toBeGreaterThan(0);
			expect(result.height).toBeGreaterThan(0);
			expect(result.scale).toBeGreaterThan(0);
		});

		it('should letterbox when screen is too wide (aspect > maxAspect)', () => {
			// Screen is 800x600 (4:3 = 1.33), wider than maxAspect
			const result = calculateViewport(800, 600, defaultConfig);

			// Should be constrained by height, with padding on sides
			expect(result.width).toBeLessThan(800);
			expect(result.height).toBe(600);
			expect(result.offsetX).toBeGreaterThan(0);
			expect(result.offsetY).toBe(0);
		});

		it('should pillarbox when screen is too tall (aspect < minAspect)', () => {
			// Screen is 300x800 (0.375), taller than minAspect
			const result = calculateViewport(300, 800, defaultConfig);

			// Should be constrained by width, with padding on top/bottom
			expect(result.width).toBe(300);
			expect(result.height).toBeLessThan(800);
			expect(result.offsetX).toBe(0);
			expect(result.offsetY).toBeGreaterThan(0);
		});

		it('should fill the screen when aspect is exactly at minAspect', () => {
			// Screen at exactly minAspect (0.5)
			const result = calculateViewport(360, 720, defaultConfig);

			expect(result.width).toBe(360);
			expect(result.height).toBe(720);
			expect(result.offsetX).toBe(0);
			expect(result.offsetY).toBe(0);
		});

		it('should fill the screen when aspect is exactly at maxAspect', () => {
			// Screen at exactly maxAspect (9/14 = 0.6428...)
			const width = 360;
			const height = Math.round(width / defaultConfig.maxAspect);
			const result = calculateViewport(width, height, defaultConfig);

			expect(result.width).toBe(width);
			expect(result.height).toBe(height);
			expect(result.offsetX).toBe(0);
			expect(result.offsetY).toBe(0);
		});

		it('should calculate correct scale based on base width', () => {
			const result = calculateViewport(360, 640, defaultConfig);

			// Scale should be viewport width / base width
			expect(result.scale).toBe(result.width / defaultConfig.baseWidth);
		});

		it('should calculate game unit pixel size', () => {
			const result = calculateViewport(360, 640, defaultConfig);

			// 1 game unit = scale pixels
			expect(result.gu).toBe(result.scale);
			// 1 game unit height = height / baseHeight
			expect(result.guh).toBeCloseTo(result.height / defaultConfig.baseHeight, 2);
		});

		it('should handle zero dimensions gracefully', () => {
			const result = calculateViewport(0, 0, defaultConfig);

			expect(result.width).toBe(0);
			expect(result.height).toBe(0);
			expect(result.scale).toBe(0);
		});

		it('should handle very small screens', () => {
			const result = calculateViewport(50, 100, defaultConfig);

			expect(result.width).toBeGreaterThan(0);
			expect(result.height).toBeGreaterThan(0);
			expect(result.width).toBeLessThanOrEqual(50);
			expect(result.height).toBeLessThanOrEqual(100);
		});

		it('should handle very large screens', () => {
			const result = calculateViewport(4000, 8000, defaultConfig);

			expect(result.width).toBeGreaterThan(0);
			expect(result.height).toBeGreaterThan(0);
			expect(result.width).toBeLessThanOrEqual(4000);
			expect(result.height).toBeLessThanOrEqual(8000);
		});
	});

	describe('aspect ratio clamping', () => {
		it('should clamp aspect ratio to minAspect when screen is very tall', () => {
			// Very tall screen (aspect = 0.25)
			const result = calculateViewport(200, 800, defaultConfig);
			const actualAspect = result.width / result.height;

			expect(actualAspect).toBeCloseTo(defaultConfig.minAspect, 2);
		});

		it('should clamp aspect ratio to maxAspect when screen is very wide', () => {
			// Very wide screen (aspect = 2.0)
			const result = calculateViewport(800, 400, defaultConfig);
			const actualAspect = result.width / result.height;

			expect(actualAspect).toBeCloseTo(defaultConfig.maxAspect, 2);
		});
	});

	describe('custom config', () => {
		it('should respect custom aspect ratio bounds', () => {
			const customConfig: ViewportConfig = {
				minAspect: 0.4,
				maxAspect: 0.8,
				baseWidth: 200,
				baseHeight: 400
			};

			// Screen wider than maxAspect
			const result = calculateViewport(800, 600, customConfig);
			const actualAspect = result.width / result.height;

			expect(actualAspect).toBeCloseTo(customConfig.maxAspect, 2);
		});

		it('should use custom base dimensions for scaling', () => {
			const customConfig: ViewportConfig = {
				minAspect: 0.5,
				maxAspect: 0.7,
				baseWidth: 200,
				baseHeight: 400
			};

			const result = calculateViewport(400, 800, customConfig);

			expect(result.scale).toBe(result.width / customConfig.baseWidth);
		});
	});
});
