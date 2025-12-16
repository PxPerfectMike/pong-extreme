import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTween, type TweenOptions, type Tween } from '$engine/tween/Tween';
import { linear, easeOutQuad } from '$engine/tween/easings';

describe('Tween', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('createTween', () => {
		it('should create a tween instance', () => {
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate: vi.fn()
			});

			expect(tween).toBeDefined();
			expect(typeof tween.start).toBe('function');
			expect(typeof tween.stop).toBe('function');
			expect(typeof tween.pause).toBe('function');
			expect(typeof tween.resume).toBe('function');
		});

		it('should not start automatically', () => {
			const onUpdate = vi.fn();
			createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate
			});

			vi.advanceTimersByTime(500);

			expect(onUpdate).not.toHaveBeenCalled();
		});
	});

	describe('start', () => {
		it('should start the animation and call onUpdate', () => {
			const onUpdate = vi.fn();
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				easing: linear,
				onUpdate
			});

			tween.start();

			// Simulate a frame
			vi.advanceTimersByTime(16);

			expect(onUpdate).toHaveBeenCalled();
		});

		it('should return the tween for chaining', () => {
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate: vi.fn()
			});

			expect(tween.start()).toBe(tween);
		});

		it('should interpolate values over time', () => {
			const values: number[] = [];
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				easing: linear,
				onUpdate: (v) => values.push(v)
			});

			tween.start();

			// Advance by 500ms (50%)
			vi.advanceTimersByTime(500);

			expect(values.length).toBeGreaterThan(0);
			// Last value should be around 50 (linear easing at 50%)
			const lastValue = values[values.length - 1];
			expect(lastValue).toBeGreaterThanOrEqual(45);
			expect(lastValue).toBeLessThanOrEqual(55);
		});

		it('should call onComplete when finished', () => {
			const onComplete = vi.fn();
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 100,
				easing: linear,
				onUpdate: vi.fn(),
				onComplete
			});

			tween.start();
			vi.advanceTimersByTime(150);

			expect(onComplete).toHaveBeenCalled();
		});

		it('should reach exact end value', () => {
			const values: number[] = [];
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 100,
				easing: linear,
				onUpdate: (v) => values.push(v)
			});

			tween.start();
			vi.advanceTimersByTime(150);

			expect(values[values.length - 1]).toBe(100);
		});
	});

	describe('stop', () => {
		it('should stop the animation', () => {
			const onUpdate = vi.fn();
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate
			});

			tween.start();
			vi.advanceTimersByTime(100);
			const callCount = onUpdate.mock.calls.length;

			tween.stop();
			vi.advanceTimersByTime(500);

			expect(onUpdate.mock.calls.length).toBe(callCount);
		});

		it('should not call onComplete when stopped', () => {
			const onComplete = vi.fn();
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate: vi.fn(),
				onComplete
			});

			tween.start();
			vi.advanceTimersByTime(500);
			tween.stop();
			vi.advanceTimersByTime(1000);

			expect(onComplete).not.toHaveBeenCalled();
		});
	});

	describe('pause / resume', () => {
		it('should pause the animation', () => {
			const onUpdate = vi.fn();
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate
			});

			tween.start();
			vi.advanceTimersByTime(100);
			const callCount = onUpdate.mock.calls.length;

			tween.pause();
			vi.advanceTimersByTime(500);

			expect(onUpdate.mock.calls.length).toBe(callCount);
		});

		it('should resume from where it paused', () => {
			const values: number[] = [];
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				easing: linear,
				onUpdate: (v) => values.push(v)
			});

			tween.start();
			vi.advanceTimersByTime(500); // 50%
			const valueAtPause = values[values.length - 1];

			tween.pause();
			vi.advanceTimersByTime(1000); // Should not change

			tween.resume();
			vi.advanceTimersByTime(100);

			const valueAfterResume = values[values.length - 1];
			// Should continue from ~50%, not restart
			expect(valueAfterResume).toBeGreaterThan(valueAtPause);
		});
	});

	describe('easing', () => {
		it('should use linear easing by default', () => {
			const values: number[] = [];
			const tween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				onUpdate: (v) => values.push(v)
			});

			tween.start();
			vi.advanceTimersByTime(500);

			const midValue = values[values.length - 1];
			// Linear should be close to 50 at 50%
			expect(midValue).toBeGreaterThanOrEqual(45);
			expect(midValue).toBeLessThanOrEqual(55);
		});

		it('should apply custom easing function', () => {
			const linearValues: number[] = [];
			const easedValues: number[] = [];

			const linearTween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				easing: linear,
				onUpdate: (v) => linearValues.push(v)
			});

			const easedTween = createTween({
				from: 0,
				to: 100,
				duration: 1000,
				easing: easeOutQuad,
				onUpdate: (v) => easedValues.push(v)
			});

			linearTween.start();
			easedTween.start();
			vi.advanceTimersByTime(300);

			// easeOutQuad starts faster than linear
			const linearMid = linearValues[linearValues.length - 1];
			const easedMid = easedValues[easedValues.length - 1];
			expect(easedMid).toBeGreaterThan(linearMid);
		});
	});

	describe('negative values', () => {
		it('should work with negative from/to values', () => {
			const values: number[] = [];
			const tween = createTween({
				from: -50,
				to: 50,
				duration: 1000,
				easing: linear,
				onUpdate: (v) => values.push(v)
			});

			tween.start();
			vi.advanceTimersByTime(500);

			const midValue = values[values.length - 1];
			expect(midValue).toBeGreaterThanOrEqual(-10);
			expect(midValue).toBeLessThanOrEqual(10);
		});
	});

	describe('reverse animation (to < from)', () => {
		it('should work when animating to a smaller value', () => {
			const values: number[] = [];
			const tween = createTween({
				from: 100,
				to: 0,
				duration: 100,
				easing: linear,
				onUpdate: (v) => values.push(v)
			});

			tween.start();
			vi.advanceTimersByTime(150);

			expect(values[0]).toBeGreaterThan(values[values.length - 1]);
			expect(values[values.length - 1]).toBe(0);
		});
	});
});
