import { linear, type EasingFunction } from './easings';

/**
 * Options for creating a tween.
 */
export interface TweenOptions {
	/** Starting value */
	from: number;
	/** Target value */
	to: number;
	/** Duration in milliseconds */
	duration: number;
	/** Easing function (defaults to linear) */
	easing?: EasingFunction;
	/** Called on each frame with the current value */
	onUpdate: (value: number) => void;
	/** Called when the animation completes */
	onComplete?: () => void;
}

/**
 * Tween instance interface.
 */
export interface Tween {
	/** Start the animation */
	start(): Tween;
	/** Stop the animation (cannot be resumed) */
	stop(): void;
	/** Pause the animation */
	pause(): void;
	/** Resume a paused animation */
	resume(): void;
	/** Check if the tween is running */
	isRunning(): boolean;
	/** Check if the tween is paused */
	isPaused(): boolean;
}

/**
 * Create a tween animation that interpolates between two values.
 *
 * @param options - Tween configuration
 * @returns Tween instance
 *
 * @example
 * ```typescript
 * const tween = createTween({
 *   from: 0,
 *   to: 100,
 *   duration: 1000,
 *   easing: easeOutQuad,
 *   onUpdate: (value) => {
 *     element.style.opacity = value / 100;
 *   },
 *   onComplete: () => {
 *     console.log('Animation complete!');
 *   }
 * });
 *
 * tween.start();
 * ```
 */
export function createTween(options: TweenOptions): Tween {
	const { from, to, duration, easing = linear, onUpdate, onComplete } = options;

	let startTime: number | null = null;
	let pausedAt: number | null = null;
	let pausedProgress = 0;
	let rafId: number | null = null;
	let isRunning = false;
	let isPaused = false;
	let isStopped = false;

	function tick(currentTime: number) {
		if (isStopped || isPaused) return;

		if (startTime === null) {
			startTime = currentTime;
		}

		const elapsed = currentTime - startTime;
		let progress = Math.min(elapsed / duration, 1);

		// Apply easing
		const easedProgress = easing(progress);

		// Interpolate value
		const value = from + (to - from) * easedProgress;

		onUpdate(value);

		if (progress < 1) {
			rafId = requestAnimationFrame(tick);
		} else {
			isRunning = false;
			onUpdate(to); // Ensure exact end value
			onComplete?.();
		}
	}

	return {
		start(): Tween {
			if (isRunning || isStopped) return this;

			isRunning = true;
			isPaused = false;
			startTime = null;
			rafId = requestAnimationFrame(tick);

			return this;
		},

		stop(): void {
			isStopped = true;
			isRunning = false;
			isPaused = false;

			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		},

		pause(): void {
			if (!isRunning || isPaused) return;

			isPaused = true;
			isRunning = false;

			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			// Store how much time had elapsed
			if (startTime !== null) {
				pausedAt = performance.now();
				pausedProgress = pausedAt - startTime;
			}
		},

		resume(): void {
			if (!isPaused || isStopped) return;

			isPaused = false;
			isRunning = true;

			// Adjust start time to account for paused time
			if (pausedProgress > 0) {
				startTime = performance.now() - pausedProgress;
			}

			rafId = requestAnimationFrame(tick);
		},

		isRunning(): boolean {
			return isRunning;
		},

		isPaused(): boolean {
			return isPaused;
		}
	};
}

/**
 * Create multiple tweens that run in parallel.
 *
 * @param tweenOptions - Array of tween options
 * @returns Control object for all tweens
 */
export function createParallelTweens(tweenOptions: TweenOptions[]): {
	start: () => void;
	stop: () => void;
	pause: () => void;
	resume: () => void;
} {
	const tweens = tweenOptions.map(createTween);

	return {
		start() {
			tweens.forEach((t) => t.start());
		},
		stop() {
			tweens.forEach((t) => t.stop());
		},
		pause() {
			tweens.forEach((t) => t.pause());
		},
		resume() {
			tweens.forEach((t) => t.resume());
		}
	};
}

/**
 * Create a sequence of tweens that run one after another.
 *
 * @param tweenOptions - Array of tween options
 * @returns Promise that resolves when all tweens complete
 */
export function createSequentialTweens(tweenOptions: TweenOptions[]): Promise<void> {
	return new Promise((resolve) => {
		let index = 0;

		function runNext() {
			if (index >= tweenOptions.length) {
				resolve();
				return;
			}

			const options = tweenOptions[index];
			const tween = createTween({
				...options,
				onComplete: () => {
					options.onComplete?.();
					index++;
					runNext();
				}
			});

			tween.start();
		}

		runNext();
	});
}
