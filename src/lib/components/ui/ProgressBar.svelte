<script lang="ts">
	interface Props {
		/** Progress value (0-100) */
		value?: number;
		/** Maximum value */
		max?: number;
		/** Show percentage text */
		showLabel?: boolean;
		/** Custom label */
		label?: string;
		/** Bar color */
		color?: string;
		/** Bar height */
		height?: string;
		/** Animate changes */
		animated?: boolean;
	}

	let {
		value = 0,
		max = 100,
		showLabel = false,
		label,
		color = 'var(--color-primary)',
		height = 'calc(var(--gu) * 2)',
		animated = true
	}: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
	const displayLabel = $derived(label ?? `${Math.round(percentage)}%`);
</script>

<div class="progress-container">
	{#if showLabel}
		<div class="progress-label">{displayLabel}</div>
	{/if}
	<div
		class="progress-track"
		style:height={height}
		role="progressbar"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={max}
	>
		<div
			class="progress-fill"
			class:animated
			style:width="{percentage}%"
			style:background-color={color}
		></div>
	</div>
</div>

<style>
	.progress-container {
		width: 100%;
	}

	.progress-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-xs);
		text-align: center;
	}

	.progress-track {
		width: 100%;
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: var(--radius-full);
	}

	.progress-fill.animated {
		transition: width var(--transition-normal);
	}
</style>
