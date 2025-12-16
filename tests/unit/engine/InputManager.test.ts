import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	createInputManager,
	type InputManager,
	type Point,
	type SwipeDirection,
	type InputConfig
} from '$engine/input/InputManager';

describe('InputManager', () => {
	let element: HTMLElement;
	let manager: InputManager;

	beforeEach(() => {
		// Create mock element
		element = document.createElement('div');
		element.getBoundingClientRect = vi.fn().mockReturnValue({
			left: 0,
			top: 0,
			width: 360,
			height: 640
		});
		document.body.appendChild(element);
	});

	afterEach(() => {
		manager?.destroy();
		element?.remove();
	});

	describe('createInputManager', () => {
		it('should create an input manager for an element', () => {
			manager = createInputManager(element);

			expect(manager).toBeDefined();
			expect(typeof manager.onTap).toBe('function');
			expect(typeof manager.onSwipe).toBe('function');
			expect(typeof manager.onDrag).toBe('function');
			expect(typeof manager.destroy).toBe('function');
		});

		it('should accept custom config', () => {
			const config: InputConfig = {
				swipeThreshold: 100,
				tapMaxDuration: 500,
				tapMaxDistance: 20
			};

			manager = createInputManager(element, config);

			expect(manager).toBeDefined();
		});
	});

	describe('onTap', () => {
		it('should register tap callback', () => {
			manager = createInputManager(element);
			const callback = vi.fn();

			manager.onTap(callback);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should call tap callback on quick touch', () => {
			manager = createInputManager(element);
			const callback = vi.fn();
			manager.onTap(callback);

			// Simulate touch start
			const touchStart = new TouchEvent('touchstart', {
				touches: [{ clientX: 100, clientY: 200, identifier: 0 } as Touch]
			});
			element.dispatchEvent(touchStart);

			// Simulate touch end quickly (within tap threshold)
			const touchEnd = new TouchEvent('touchend', {
				changedTouches: [{ clientX: 100, clientY: 200, identifier: 0 } as Touch]
			});
			element.dispatchEvent(touchEnd);

			expect(callback).toHaveBeenCalled();
			expect(callback.mock.calls[0][0]).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
		});

		it('should return unsubscribe function', () => {
			manager = createInputManager(element);
			const callback = vi.fn();

			const unsubscribe = manager.onTap(callback);
			unsubscribe();

			// Simulate tap
			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 100, clientY: 200, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 100, clientY: 200, identifier: 0 } as Touch]
			}));

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('onSwipe', () => {
		it('should register swipe callback', () => {
			manager = createInputManager(element);
			const callback = vi.fn();

			manager.onSwipe(callback);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should detect swipe left', () => {
			manager = createInputManager(element, { swipeThreshold: 30 });
			const callback = vi.fn();
			manager.onSwipe(callback);

			// Simulate swipe left
			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 200, clientY: 300, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 100, clientY: 300, identifier: 0 } as Touch]
			}));

			expect(callback).toHaveBeenCalledWith('left', expect.any(Number));
		});

		it('should detect swipe right', () => {
			manager = createInputManager(element, { swipeThreshold: 30 });
			const callback = vi.fn();
			manager.onSwipe(callback);

			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 100, clientY: 300, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 200, clientY: 300, identifier: 0 } as Touch]
			}));

			expect(callback).toHaveBeenCalledWith('right', expect.any(Number));
		});

		it('should detect swipe up', () => {
			manager = createInputManager(element, { swipeThreshold: 30 });
			const callback = vi.fn();
			manager.onSwipe(callback);

			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 180, clientY: 400, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 180, clientY: 200, identifier: 0 } as Touch]
			}));

			expect(callback).toHaveBeenCalledWith('up', expect.any(Number));
		});

		it('should detect swipe down', () => {
			manager = createInputManager(element, { swipeThreshold: 30 });
			const callback = vi.fn();
			manager.onSwipe(callback);

			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 180, clientY: 200, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 180, clientY: 400, identifier: 0 } as Touch]
			}));

			expect(callback).toHaveBeenCalledWith('down', expect.any(Number));
		});
	});

	describe('onDrag', () => {
		it('should register drag callback', () => {
			manager = createInputManager(element);
			const callback = vi.fn();

			manager.onDrag(callback);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should call drag callback during touch move', () => {
			manager = createInputManager(element);
			const callback = vi.fn();
			manager.onDrag(callback);

			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 100, clientY: 100, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchmove', {
				touches: [{ clientX: 150, clientY: 120, identifier: 0 } as Touch]
			}));

			expect(callback).toHaveBeenCalled();
			const [start, current, delta] = callback.mock.calls[0];
			expect(start).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
			expect(current).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
			expect(delta).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
		});
	});

	describe('onPinch', () => {
		it('should register pinch callback', () => {
			manager = createInputManager(element);
			const callback = vi.fn();

			manager.onPinch(callback);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should detect pinch gesture with two fingers', () => {
			manager = createInputManager(element);
			const callback = vi.fn();
			manager.onPinch(callback);

			// Start with two fingers
			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [
					{ clientX: 100, clientY: 300, identifier: 0 } as Touch,
					{ clientX: 200, clientY: 300, identifier: 1 } as Touch
				]
			}));

			// Move fingers apart (zoom in)
			element.dispatchEvent(new TouchEvent('touchmove', {
				touches: [
					{ clientX: 50, clientY: 300, identifier: 0 } as Touch,
					{ clientX: 250, clientY: 300, identifier: 1 } as Touch
				]
			}));

			expect(callback).toHaveBeenCalled();
			const [scale, center] = callback.mock.calls[0];
			expect(scale).toBeGreaterThan(1); // Zoom in = scale > 1
			expect(center).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
		});
	});

	describe('coordinate conversion', () => {
		it('should convert screen coordinates to element-relative coordinates', () => {
			element.getBoundingClientRect = vi.fn().mockReturnValue({
				left: 50,
				top: 100,
				width: 360,
				height: 640
			});

			manager = createInputManager(element);
			const callback = vi.fn();
			manager.onTap(callback);

			// Touch at screen position (150, 300)
			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 150, clientY: 300, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 150, clientY: 300, identifier: 0 } as Touch]
			}));

			// Should be relative to element: (150-50, 300-100) = (100, 200)
			expect(callback).toHaveBeenCalled();
			const pos = callback.mock.calls[0][0];
			expect(pos.x).toBeCloseTo(100, 0);
			expect(pos.y).toBeCloseTo(200, 0);
		});
	});

	describe('destroy', () => {
		it('should remove all event listeners', () => {
			manager = createInputManager(element);
			const callback = vi.fn();
			manager.onTap(callback);

			manager.destroy();

			// Simulate tap after destroy
			element.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 100, clientY: 200, identifier: 0 } as Touch]
			}));
			element.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 100, clientY: 200, identifier: 0 } as Touch]
			}));

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('isSupported', () => {
		it('should check for touch support', () => {
			manager = createInputManager(element);

			// In jsdom, touch events exist but may not be "supported"
			expect(typeof manager.isSupported()).toBe('boolean');
		});
	});
});
