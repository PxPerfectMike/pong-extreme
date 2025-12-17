<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		onPlay: () => void;
	}

	let { onPlay }: Props = $props();
</script>

<div class="title-scene">
	<div class="logo-container">
		<h1 class="title">PONG</h1>
		<h2 class="subtitle">EXTREME</h2>
	</div>

	<div class="tagline">
		<p>Mobile Multiplayer Battle</p>
	</div>

	<div class="actions">
		<Button variant="primary" size="lg" fullWidth onclick={onPlay}>
			PLAY
		</Button>
	</div>

	<div class="decorations">
		<div class="ball"></div>
		<div class="paddle paddle-left"></div>
		<div class="paddle paddle-right"></div>
	</div>
</div>

<style>
	.title-scene {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: var(--space-lg);
		position: relative;
		overflow: hidden;
	}

	.logo-container {
		text-align: center;
		margin-bottom: var(--space-lg);
	}

	.title {
		font-size: calc(var(--gu) * 16);
		font-weight: 900;
		color: var(--color-primary);
		text-shadow:
			0 0 20px var(--color-primary),
			0 0 40px var(--color-primary),
			0 0 60px var(--color-primary);
		letter-spacing: 0.2em;
		margin: 0;
		animation: glow 2s ease-in-out infinite alternate;
	}

	.subtitle {
		font-size: calc(var(--gu) * 8);
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: 0.4em;
		margin: 0;
		margin-top: calc(var(--gu) * -2);
	}

	.tagline {
		margin-bottom: var(--space-xl);
	}

	.tagline p {
		font-size: var(--text-md);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.actions {
		width: 100%;
		max-width: calc(var(--gu) * 60);
	}

	/* Decorative elements */
	.decorations {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: -1;
	}

	.ball {
		position: absolute;
		width: calc(var(--gu) * 4);
		height: calc(var(--gu) * 4);
		background: var(--color-primary);
		border-radius: 50%;
		top: 20%;
		left: 30%;
		box-shadow: 0 0 20px var(--color-primary);
		animation: float 3s ease-in-out infinite;
	}

	.paddle {
		position: absolute;
		width: calc(var(--gu) * 2);
		height: calc(var(--gu) * 12);
		background: var(--color-text);
		border-radius: var(--radius-sm);
		opacity: 0.3;
	}

	.paddle-left {
		left: 10%;
		top: 40%;
		animation: paddle-move 2s ease-in-out infinite;
	}

	.paddle-right {
		right: 10%;
		top: 30%;
		animation: paddle-move 2s ease-in-out infinite reverse;
	}

	@keyframes glow {
		from {
			text-shadow:
				0 0 20px var(--color-primary),
				0 0 40px var(--color-primary);
		}
		to {
			text-shadow:
				0 0 30px var(--color-primary),
				0 0 60px var(--color-primary),
				0 0 80px var(--color-primary);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(20px, -30px);
		}
	}

	@keyframes paddle-move {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(30px);
		}
	}
</style>
