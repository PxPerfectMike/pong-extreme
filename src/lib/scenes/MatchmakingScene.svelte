<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		username: string;
		queuePosition: number;
		totalInQueue: number;
		onCancel: () => void;
	}

	let { username, queuePosition, totalInQueue, onCancel }: Props = $props();

	// Animated dots
	let dots = $state('');
	$effect(() => {
		const interval = setInterval(() => {
			dots = dots.length >= 3 ? '' : dots + '.';
		}, 500);

		return () => clearInterval(interval);
	});
</script>

<div class="matchmaking-scene">
	<div class="content">
		<div class="spinner-container">
			<div class="spinner"></div>
		</div>

		<h1 class="title">Searching{dots}</h1>

		<p class="status">
			Looking for an opponent
		</p>

		<div class="player-info">
			<div class="avatar">{username.charAt(0).toUpperCase()}</div>
			<span class="username">{username}</span>
		</div>

		{#if queuePosition > 0}
			<div class="queue-info">
				<p>Position in queue: <strong>{queuePosition}</strong></p>
				{#if totalInQueue > 1}
					<p class="hint">{totalInQueue} players searching</p>
				{/if}
			</div>
		{/if}
	</div>

	<div class="actions">
		<Button variant="secondary" size="md" fullWidth onclick={onCancel}>
			CANCEL
		</Button>
	</div>
</div>

<style>
	.matchmaking-scene {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: var(--space-lg);
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.spinner-container {
		margin-bottom: var(--space-xl);
	}

	.spinner {
		width: calc(var(--gu) * 16);
		height: calc(var(--gu) * 16);
		border: 4px solid var(--color-secondary);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.title {
		font-size: var(--text-2xl);
		color: var(--color-text);
		margin-bottom: var(--space-sm);
		min-width: 200px;
	}

	.status {
		font-size: var(--text-md);
		color: var(--color-text-muted);
		margin-bottom: var(--space-xl);
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--color-secondary);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-lg);
	}

	.avatar {
		width: calc(var(--gu) * 10);
		height: calc(var(--gu) * 10);
		background: var(--color-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-xl);
		font-weight: bold;
		color: var(--color-text);
	}

	.username {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.queue-info {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.queue-info strong {
		color: var(--color-primary);
	}

	.hint {
		margin-top: var(--space-xs);
		opacity: 0.7;
	}

	.actions {
		padding-top: var(--space-lg);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
