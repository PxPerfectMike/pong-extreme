<script lang="ts">
	import { onMount } from 'svelte';
	import { calculateViewport, defaultViewportConfig, type ViewportConfig, type ViewportResult } from './viewport';
	import { setUnitScale, createUnitStyles } from './units';

	interface Props {
		/** Viewport configuration. Uses mobile-optimized defaults if not provided. */
		config?: ViewportConfig;
		/** Custom background color for letterbox/pillarbox areas */
		backgroundColor?: string;
		/** Children to render inside the game container */
		children?: import('svelte').Snippet;
	}

	let {
		config = defaultViewportConfig,
		backgroundColor = 'var(--color-bg)',
		children
	}: Props = $props();

	let containerRef: HTMLDivElement | undefined = $state();
	let viewport: ViewportResult = $state({
		width: 0,
		height: 0,
		offsetX: 0,
		offsetY: 0,
		scale: 0,
		gu: 0,
		guh: 0
	});

	function updateViewport() {
		if (typeof window === 'undefined') return;

		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		viewport = calculateViewport(screenWidth, screenHeight, config);
		setUnitScale({ gu: viewport.gu, guh: viewport.guh });
	}

	onMount(() => {
		updateViewport();

		// Use ResizeObserver for more reliable updates
		const resizeObserver = new ResizeObserver(() => {
			updateViewport();
		});

		// Also listen to window resize for orientation changes
		window.addEventListener('resize', updateViewport);
		window.addEventListener('orientationchange', updateViewport);

		// Observe document body for size changes
		resizeObserver.observe(document.body);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateViewport);
			window.removeEventListener('orientationchange', updateViewport);
		};
	});

	const containerStyle = $derived(
		viewport.width > 0
			? `
				width: ${viewport.width}px;
				height: ${viewport.height}px;
				left: ${viewport.offsetX}px;
				top: ${viewport.offsetY}px;
				${createUnitStyles({ gu: viewport.gu, guh: viewport.guh })}
			`
			: ''
	);
</script>

<div
	class="game-wrapper"
	style:background-color={backgroundColor}
>
	<div
		bind:this={containerRef}
		class="game-container"
		style={containerStyle}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.game-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.game-container {
		position: absolute;
		overflow: hidden;
		background-color: var(--color-surface, #16213e);
	}
</style>
