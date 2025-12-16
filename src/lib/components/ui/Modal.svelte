<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** Close handler */
		onclose?: () => void;
		/** Whether clicking backdrop closes modal */
		closeOnBackdrop?: boolean;
		/** Modal title */
		title?: string;
		/** Modal content */
		children: Snippet;
	}

	let {
		open = false,
		onclose,
		closeOnBackdrop = true,
		title,
		children
	}: Props = $props();

	function handleBackdropClick() {
		if (closeOnBackdrop && onclose) {
			onclose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && onclose) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="modal-backdrop"
		role="presentation"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="modal"
			transition:scale={{ duration: 200, start: 0.9 }}
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
		>
			{#if title}
				<div class="modal-header">
					<h2 id="modal-title" class="modal-title">{title}</h2>
					{#if onclose}
						<button class="modal-close" onclick={onclose} aria-label="Close">
							×
						</button>
					{/if}
				</div>
			{/if}
			<div class="modal-content">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		z-index: 1000;
	}

	.modal {
		background-color: var(--color-surface);
		border-radius: var(--radius-lg);
		max-width: 90%;
		max-height: 90%;
		overflow: auto;
		box-shadow: 0 calc(var(--gu) * 2) calc(var(--gu) * 4) rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-title {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: var(--text-xl);
		cursor: pointer;
		padding: 0;
		line-height: 1;
		transition: color var(--transition-fast);
	}

	.modal-close:hover {
		color: var(--color-text);
	}

	.modal-content {
		padding: var(--space-md);
	}
</style>
