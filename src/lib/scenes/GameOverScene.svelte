<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		didWin: boolean;
		localScore: number;
		opponentScore: number;
		opponent: string;
		onPlayAgain: () => void;
		onMainMenu: () => void;
	}

	let { didWin, localScore, opponentScore, opponent, onPlayAgain, onMainMenu }: Props = $props();
</script>

<div class="game-over-scene">
	<div class="result-container" class:win={didWin} class:lose={!didWin}>
		<div class="result-icon">
			{#if didWin}
				<svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
				</svg>
			{:else}
				<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" />
					<path d="M8 15s1.5-2 4-2 4 2 4 2" />
					<line x1="9" y1="9" x2="9.01" y2="9" />
					<line x1="15" y1="9" x2="15.01" y2="9" />
				</svg>
			{/if}
		</div>

		<h1 class="result-text">
			{didWin ? 'VICTORY!' : 'DEFEAT'}
		</h1>

		<p class="result-subtitle">
			{didWin ? 'You crushed your opponent!' : 'Better luck next time!'}
		</p>
	</div>

	<div class="score-summary">
		<div class="final-score">
			<div class="score-side local">
				<span class="player-label">YOU</span>
				<span class="player-score" class:winner={localScore > opponentScore}>
					{localScore}
				</span>
			</div>
			<span class="vs">vs</span>
			<div class="score-side opponent">
				<span class="player-score" class:winner={opponentScore > localScore}>
					{opponentScore}
				</span>
				<span class="player-label">{opponent}</span>
			</div>
		</div>
	</div>

	<div class="actions">
		<Button variant="primary" size="lg" fullWidth onclick={onPlayAgain}>
			PLAY AGAIN
		</Button>
		<Button variant="secondary" size="md" fullWidth onclick={onMainMenu}>
			MAIN MENU
		</Button>
	</div>
</div>

<style>
	.game-over-scene {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: var(--space-lg);
		gap: var(--space-xl);
	}

	.result-container {
		text-align: center;
	}

	.result-icon {
		margin-bottom: var(--space-md);
		animation: bounce 0.5s ease-out;
	}

	.win .result-icon {
		color: #ffd700;
		filter: drop-shadow(0 0 20px #ffd700);
	}

	.lose .result-icon {
		color: var(--color-text-muted);
	}

	.result-text {
		font-size: var(--text-2xl);
		font-weight: 900;
		letter-spacing: 0.1em;
		margin-bottom: var(--space-sm);
	}

	.win .result-text {
		color: #ffd700;
		text-shadow: 0 0 20px #ffd700;
	}

	.lose .result-text {
		color: var(--color-text-muted);
	}

	.result-subtitle {
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.score-summary {
		width: 100%;
		max-width: calc(var(--gu) * 60);
	}

	.final-score {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		padding: var(--space-lg);
		background: var(--color-secondary);
		border-radius: var(--radius-lg);
	}

	.score-side {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
	}

	.player-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.player-score {
		font-size: calc(var(--gu) * 12);
		font-weight: bold;
		color: var(--color-text);
	}

	.player-score.winner {
		color: var(--color-primary);
		text-shadow: 0 0 10px var(--color-primary);
	}

	.vs {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}

	.actions {
		width: 100%;
		max-width: calc(var(--gu) * 60);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	@keyframes bounce {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
