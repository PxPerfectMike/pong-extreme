/**
 * Unit scale representing pixels per game unit.
 */
export interface UnitScale {
	/** Pixels per game unit (width-based) */
	gu: number;
	/** Pixels per game unit (height-based) */
	guh: number;
}

// Current unit scale (mutable singleton for runtime conversion)
let currentScale: UnitScale = { gu: 1, guh: 1 };

/**
 * Set the current unit scale. Called by GameContainer on resize.
 *
 * @param scale - New unit scale
 */
export function setUnitScale(scale: UnitScale): void {
	currentScale = { ...scale };
}

/**
 * Get the current unit scale.
 *
 * @returns Current unit scale
 */
export function getUnitScale(): UnitScale {
	return { ...currentScale };
}

/**
 * Template tag for creating CSS expressions using game units (width-based).
 * Usage: gu`10` → "calc(var(--gu) * 10)"
 *
 * @example
 * const style = `width: ${gu`50`}; height: ${gu`30`};`
 */
export function gu(strings: TemplateStringsArray, ...values: unknown[]): string {
	// Combine the template parts
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += String(values[i]) + strings[i + 1];
	}
	return `calc(var(--gu) * ${result})`;
}

/**
 * Template tag for creating CSS expressions using game unit heights.
 * Usage: guh`10` → "calc(var(--guh) * 10)"
 *
 * @example
 * const style = `height: ${guh`50`};`
 */
export function guh(strings: TemplateStringsArray, ...values: unknown[]): string {
	// Combine the template parts
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += String(values[i]) + strings[i + 1];
	}
	return `calc(var(--guh) * ${result})`;
}

/**
 * Convert game units to pixels using current scale.
 *
 * @param units - Value in game units
 * @returns Value in pixels
 */
export function guToPx(units: number): number {
	return units * currentScale.gu;
}

/**
 * Convert game unit heights to pixels using current scale.
 *
 * @param units - Value in game unit heights
 * @returns Value in pixels
 */
export function guhToPx(units: number): number {
	return units * currentScale.guh;
}

/**
 * Convert pixels to game units using current scale.
 *
 * @param px - Value in pixels
 * @returns Value in game units
 */
export function pxToGu(px: number): number {
	if (currentScale.gu === 0) return 0;
	return px / currentScale.gu;
}

/**
 * Convert pixels to game unit heights using current scale.
 *
 * @param px - Value in pixels
 * @returns Value in game unit heights
 */
export function pxToGuh(px: number): number {
	if (currentScale.guh === 0) return 0;
	return px / currentScale.guh;
}

/**
 * Create a CSS custom properties object for applying to a container element.
 * This sets the --gu and --guh variables used by the gu/guh template tags.
 *
 * @param scale - Unit scale to apply
 * @returns CSS custom properties string
 */
export function createUnitStyles(scale: UnitScale): string {
	return `--gu: ${scale.gu}px; --guh: ${scale.guh}px;`;
}
