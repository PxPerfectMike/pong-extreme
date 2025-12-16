import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	gu,
	guh,
	guToPx,
	guhToPx,
	pxToGu,
	pxToGuh,
	setUnitScale,
	getUnitScale,
	type UnitScale
} from '$engine/core/units';

describe('units', () => {
	beforeEach(() => {
		// Reset to default scale before each test
		setUnitScale({ gu: 1, guh: 1 });
	});

	describe('setUnitScale / getUnitScale', () => {
		it('should set and get unit scale', () => {
			setUnitScale({ gu: 3.6, guh: 6.4 });
			const scale = getUnitScale();

			expect(scale.gu).toBe(3.6);
			expect(scale.guh).toBe(6.4);
		});

		it('should default to 1:1 scale', () => {
			const scale = getUnitScale();

			expect(scale.gu).toBe(1);
			expect(scale.guh).toBe(1);
		});
	});

	describe('gu (game unit template tag)', () => {
		it('should convert game units to CSS calc expression', () => {
			const result = gu`10`;

			expect(result).toBe('calc(var(--gu) * 10)');
		});

		it('should handle decimal values', () => {
			const result = gu`5.5`;

			expect(result).toBe('calc(var(--gu) * 5.5)');
		});

		it('should handle negative values', () => {
			const result = gu`-3`;

			expect(result).toBe('calc(var(--gu) * -3)');
		});

		it('should handle expressions with variables', () => {
			const size = 20;
			const result = gu`${size}`;

			expect(result).toBe('calc(var(--gu) * 20)');
		});
	});

	describe('guh (game unit height template tag)', () => {
		it('should convert game units to CSS calc expression using guh', () => {
			const result = guh`10`;

			expect(result).toBe('calc(var(--guh) * 10)');
		});

		it('should handle decimal values', () => {
			const result = guh`5.5`;

			expect(result).toBe('calc(var(--guh) * 5.5)');
		});

		it('should handle variables', () => {
			const size = 15;
			const result = guh`${size}`;

			expect(result).toBe('calc(var(--guh) * 15)');
		});
	});

	describe('guToPx', () => {
		it('should convert game units to pixels using current scale', () => {
			setUnitScale({ gu: 3.6, guh: 6.4 });

			expect(guToPx(10)).toBe(36);
			expect(guToPx(1)).toBe(3.6);
			expect(guToPx(0)).toBe(0);
		});

		it('should handle decimal game units', () => {
			setUnitScale({ gu: 4, guh: 8 });

			expect(guToPx(2.5)).toBe(10);
		});

		it('should handle negative values', () => {
			setUnitScale({ gu: 2, guh: 4 });

			expect(guToPx(-5)).toBe(-10);
		});
	});

	describe('guhToPx', () => {
		it('should convert game unit heights to pixels using current scale', () => {
			setUnitScale({ gu: 3.6, guh: 6.4 });

			expect(guhToPx(10)).toBe(64);
			expect(guhToPx(1)).toBe(6.4);
			expect(guhToPx(0)).toBe(0);
		});

		it('should handle decimal game units', () => {
			setUnitScale({ gu: 4, guh: 8 });

			expect(guhToPx(2.5)).toBe(20);
		});
	});

	describe('pxToGu', () => {
		it('should convert pixels to game units', () => {
			setUnitScale({ gu: 4, guh: 8 });

			expect(pxToGu(40)).toBe(10);
			expect(pxToGu(4)).toBe(1);
			expect(pxToGu(0)).toBe(0);
		});

		it('should handle non-integer results', () => {
			setUnitScale({ gu: 3, guh: 6 });

			expect(pxToGu(10)).toBeCloseTo(3.333, 2);
		});

		it('should handle zero scale gracefully', () => {
			setUnitScale({ gu: 0, guh: 0 });

			expect(pxToGu(100)).toBe(0);
		});
	});

	describe('pxToGuh', () => {
		it('should convert pixels to game unit heights', () => {
			setUnitScale({ gu: 4, guh: 8 });

			expect(pxToGuh(80)).toBe(10);
			expect(pxToGuh(8)).toBe(1);
			expect(pxToGuh(0)).toBe(0);
		});

		it('should handle non-integer results', () => {
			setUnitScale({ gu: 3, guh: 6 });

			expect(pxToGuh(10)).toBeCloseTo(1.667, 2);
		});

		it('should handle zero scale gracefully', () => {
			setUnitScale({ gu: 0, guh: 0 });

			expect(pxToGuh(100)).toBe(0);
		});
	});

	describe('CSS custom property generation', () => {
		it('should generate valid CSS values', () => {
			const width = gu`50`;
			const height = guh`30`;

			// Should be valid for style attributes
			expect(width).toMatch(/^calc\(var\(--gu\) \* .+\)$/);
			expect(height).toMatch(/^calc\(var\(--guh\) \* .+\)$/);
		});
	});
});
