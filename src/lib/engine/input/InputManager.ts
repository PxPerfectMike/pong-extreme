/**
 * A 2D point in screen or game coordinates.
 */
export interface Point {
	x: number;
	y: number;
}

/**
 * Swipe direction.
 */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Input manager configuration.
 */
export interface InputConfig {
	/** Minimum distance (pixels) for a swipe to register */
	swipeThreshold?: number;
	/** Maximum duration (ms) for a touch to be considered a tap */
	tapMaxDuration?: number;
	/** Maximum distance (pixels) for a touch to be considered a tap */
	tapMaxDistance?: number;
}

/**
 * Callback types for input events.
 */
type TapCallback = (pos: Point) => void;
type SwipeCallback = (direction: SwipeDirection, velocity: number) => void;
type DragCallback = (start: Point, current: Point, delta: Point) => void;
type PinchCallback = (scale: number, center: Point) => void;

/**
 * Input manager interface.
 */
export interface InputManager {
	/** Register tap callback */
	onTap(callback: TapCallback): () => void;
	/** Register swipe callback */
	onSwipe(callback: SwipeCallback): () => void;
	/** Register drag callback */
	onDrag(callback: DragCallback): () => void;
	/** Register pinch callback */
	onPinch(callback: PinchCallback): () => void;
	/** Check if touch is supported */
	isSupported(): boolean;
	/** Clean up event listeners */
	destroy(): void;
}

const defaultConfig: Required<InputConfig> = {
	swipeThreshold: 50,
	tapMaxDuration: 300,
	tapMaxDistance: 10
};

/**
 * Create an input manager for handling touch gestures.
 *
 * @param element - Element to listen for touch events on
 * @param config - Configuration options
 * @returns Input manager instance
 */
export function createInputManager(
	element: HTMLElement,
	config: InputConfig = {}
): InputManager {
	const cfg = { ...defaultConfig, ...config };

	const tapCallbacks = new Set<TapCallback>();
	const swipeCallbacks = new Set<SwipeCallback>();
	const dragCallbacks = new Set<DragCallback>();
	const pinchCallbacks = new Set<PinchCallback>();

	let touchStartTime = 0;
	let touchStartPos: Point | null = null;
	let lastTouchPos: Point | null = null;
	let initialPinchDistance = 0;
	let isDestroyed = false;

	function getRelativePos(clientX: number, clientY: number): Point {
		const rect = element.getBoundingClientRect();
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	function getDistance(p1: Point, p2: Point): number {
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getCenter(p1: Point, p2: Point): Point {
		return {
			x: (p1.x + p2.x) / 2,
			y: (p1.y + p2.y) / 2
		};
	}

	function handleTouchStart(e: TouchEvent) {
		if (isDestroyed) return;

		const touch = e.touches[0];
		touchStartTime = Date.now();
		touchStartPos = getRelativePos(touch.clientX, touch.clientY);
		lastTouchPos = { ...touchStartPos };

		// Check for pinch start (two fingers)
		if (e.touches.length === 2) {
			const t1 = getRelativePos(e.touches[0].clientX, e.touches[0].clientY);
			const t2 = getRelativePos(e.touches[1].clientX, e.touches[1].clientY);
			initialPinchDistance = getDistance(t1, t2);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (isDestroyed || !touchStartPos) return;

		// Handle pinch
		if (e.touches.length === 2 && initialPinchDistance > 0) {
			const t1 = getRelativePos(e.touches[0].clientX, e.touches[0].clientY);
			const t2 = getRelativePos(e.touches[1].clientX, e.touches[1].clientY);
			const currentDistance = getDistance(t1, t2);
			const scale = currentDistance / initialPinchDistance;
			const center = getCenter(t1, t2);

			pinchCallbacks.forEach((cb) => cb(scale, center));
			return;
		}

		// Handle drag
		const touch = e.touches[0];
		const current = getRelativePos(touch.clientX, touch.clientY);
		const delta: Point = {
			x: current.x - (lastTouchPos?.x ?? current.x),
			y: current.y - (lastTouchPos?.y ?? current.y)
		};

		dragCallbacks.forEach((cb) => cb(touchStartPos!, current, delta));
		lastTouchPos = current;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (isDestroyed || !touchStartPos) return;

		const touch = e.changedTouches[0];
		const endPos = getRelativePos(touch.clientX, touch.clientY);
		const duration = Date.now() - touchStartTime;
		const distance = getDistance(touchStartPos, endPos);

		// Check for tap
		if (duration < cfg.tapMaxDuration && distance < cfg.tapMaxDistance) {
			tapCallbacks.forEach((cb) => cb(endPos));
		}
		// Check for swipe
		else if (distance >= cfg.swipeThreshold) {
			const dx = endPos.x - touchStartPos.x;
			const dy = endPos.y - touchStartPos.y;
			const velocity = distance / (duration / 1000); // pixels per second

			let direction: SwipeDirection;
			if (Math.abs(dx) > Math.abs(dy)) {
				direction = dx > 0 ? 'right' : 'left';
			} else {
				direction = dy > 0 ? 'down' : 'up';
			}

			swipeCallbacks.forEach((cb) => cb(direction, velocity));
		}

		// Reset state
		touchStartPos = null;
		lastTouchPos = null;
		initialPinchDistance = 0;
	}

	// Add event listeners
	element.addEventListener('touchstart', handleTouchStart, { passive: true });
	element.addEventListener('touchmove', handleTouchMove, { passive: true });
	element.addEventListener('touchend', handleTouchEnd, { passive: true });

	return {
		onTap(callback: TapCallback): () => void {
			tapCallbacks.add(callback);
			return () => tapCallbacks.delete(callback);
		},

		onSwipe(callback: SwipeCallback): () => void {
			swipeCallbacks.add(callback);
			return () => swipeCallbacks.delete(callback);
		},

		onDrag(callback: DragCallback): () => void {
			dragCallbacks.add(callback);
			return () => dragCallbacks.delete(callback);
		},

		onPinch(callback: PinchCallback): () => void {
			pinchCallbacks.add(callback);
			return () => pinchCallbacks.delete(callback);
		},

		isSupported(): boolean {
			return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		},

		destroy(): void {
			isDestroyed = true;
			element.removeEventListener('touchstart', handleTouchStart);
			element.removeEventListener('touchmove', handleTouchMove);
			element.removeEventListener('touchend', handleTouchEnd);
			tapCallbacks.clear();
			swipeCallbacks.clear();
			dragCallbacks.clear();
			pinchCallbacks.clear();
		}
	};
}
