<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Button variant */
		variant?: 'primary' | 'secondary' | 'ghost';
		/** Button size */
		size?: 'sm' | 'md' | 'lg';
		/** Disabled state */
		disabled?: boolean;
		/** Full width */
		fullWidth?: boolean;
		/** Click handler */
		onclick?: () => void;
		/** Button content */
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		fullWidth = false,
		onclick,
		children
	}: Props = $props();
</script>

<button
	class="btn btn-{variant} btn-{size}"
	class:btn-full={fullWidth}
	{disabled}
	{onclick}
>
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		border: none;
		border-radius: var(--radius-md);
		font-family: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		-webkit-tap-highlight-color: transparent;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:not(:disabled):active {
		transform: scale(0.95);
	}

	/* Variants */
	.btn-primary {
		background-color: var(--color-primary);
		color: white;
	}

	.btn-primary:not(:disabled):hover {
		filter: brightness(1.1);
	}

	.btn-secondary {
		background-color: var(--color-secondary);
		color: white;
	}

	.btn-secondary:not(:disabled):hover {
		filter: brightness(1.2);
	}

	.btn-ghost {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-text-muted);
	}

	.btn-ghost:not(:disabled):hover {
		border-color: var(--color-text);
	}

	/* Sizes */
	.btn-sm {
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--text-sm);
	}

	.btn-md {
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-md);
	}

	.btn-lg {
		padding: var(--space-md) var(--space-lg);
		font-size: var(--text-lg);
	}

	/* Full width */
	.btn-full {
		width: 100%;
	}
</style>
