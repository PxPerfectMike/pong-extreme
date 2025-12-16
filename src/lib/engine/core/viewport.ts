/**
 * Viewport configuration for the game container.
 * Defines aspect ratio bounds and base dimensions for scaling.
 */
export interface ViewportConfig {
	/** Minimum aspect ratio (width/height). Screen taller than this will be pillarboxed. */
	minAspect: number;
	/** Maximum aspect ratio (width/height). Screen wider than this will be letterboxed. */
	maxAspect: number;
	/** Base width in game units (e.g., 100). All game coordinates are relative to this. */
	baseWidth: number;
	/** Base height in game units. Used for vertical scaling calculations. */
	baseHeight: number;
}

/**
 * Result of viewport calculation containing dimensions, offsets, and scale factors.
 */
export interface ViewportResult {
	/** Viewport width in pixels */
	width: number;
	/** Viewport height in pixels */
	height: number;
	/** Horizontal offset for centering (letterbox padding) */
	offsetX: number;
	/** Vertical offset for centering (pillarbox padding) */
	offsetY: number;
	/** Scale factor: pixels per game unit (width-based) */
	scale: number;
	/** Pixels per game unit (width-based), same as scale */
	gu: number;
	/** Pixels per game unit (height-based) */
	guh: number;
}

/**
 * Default viewport configuration for mobile portrait games.
 */
export const defaultViewportConfig: ViewportConfig = {
	minAspect: 9 / 18, // 0.5 - tall phones like iPhone X
	maxAspect: 9 / 14, // ~0.643 - shorter tablets
	baseWidth: 100,
	baseHeight: 177.78 // 16:9 aspect at baseWidth 100
};

/**
 * Calculate viewport dimensions and scaling based on screen size and config.
 * Implements flexible aspect ratio bounds with letterbox/pillarbox as needed.
 *
 * @param screenWidth - Available screen width in pixels
 * @param screenHeight - Available screen height in pixels
 * @param config - Viewport configuration
 * @returns Calculated viewport dimensions and scale factors
 */
export function calculateViewport(
	screenWidth: number,
	screenHeight: number,
	config: ViewportConfig = defaultViewportConfig
): ViewportResult {
	// Handle zero/invalid dimensions
	if (screenWidth <= 0 || screenHeight <= 0) {
		return {
			width: 0,
			height: 0,
			offsetX: 0,
			offsetY: 0,
			scale: 0,
			gu: 0,
			guh: 0
		};
	}

	const screenAspect = screenWidth / screenHeight;
	let viewportWidth: number;
	let viewportHeight: number;
	let offsetX = 0;
	let offsetY = 0;

	if (screenAspect < config.minAspect) {
		// Screen is too tall - constrain by width, pillarbox vertically
		viewportWidth = screenWidth;
		viewportHeight = screenWidth / config.minAspect;
		offsetY = (screenHeight - viewportHeight) / 2;
	} else if (screenAspect > config.maxAspect) {
		// Screen is too wide - constrain by height, letterbox horizontally
		viewportHeight = screenHeight;
		viewportWidth = screenHeight * config.maxAspect;
		offsetX = (screenWidth - viewportWidth) / 2;
	} else {
		// Screen aspect is within bounds - use full screen
		viewportWidth = screenWidth;
		viewportHeight = screenHeight;
	}

	// Calculate scale factors
	const scale = viewportWidth / config.baseWidth;
	const guh = viewportHeight / config.baseHeight;

	return {
		width: viewportWidth,
		height: viewportHeight,
		offsetX,
		offsetY,
		scale,
		gu: scale,
		guh
	};
}

/**
 * Check if a screen size is within the configured aspect ratio bounds.
 *
 * @param screenWidth - Screen width in pixels
 * @param screenHeight - Screen height in pixels
 * @param config - Viewport configuration
 * @returns True if the screen aspect ratio is within bounds
 */
export function isWithinAspectBounds(
	screenWidth: number,
	screenHeight: number,
	config: ViewportConfig = defaultViewportConfig
): boolean {
	if (screenWidth <= 0 || screenHeight <= 0) return false;

	const aspect = screenWidth / screenHeight;
	return aspect >= config.minAspect && aspect <= config.maxAspect;
}
