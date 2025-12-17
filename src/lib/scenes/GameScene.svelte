<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameState, PlayerRole } from '$game/types';
	import {
		ARENA_WIDTH,
		ARENA_HEIGHT,
		PADDLE_WIDTH,
		PADDLE_HEIGHT,
		PADDLE_MARGIN,
		BALL_RADIUS
	} from '$game/constants';

	interface Props {
		gameState: GameState;
		playerRole: PlayerRole;
		localScore: number;
		opponentScore: number;
		opponent: string;
		countdown: number;
		onPaddleMove: (y: number) => void;
	}

	let {
		gameState,
		playerRole,
		localScore,
		opponentScore,
		opponent,
		countdown,
		onPaddleMove
	}: Props = $props();

	let gameContainer: HTMLDivElement | undefined = $state();

	// Transform coordinates based on player role
	// The physics engine uses X for horizontal (ball travel direction)
	// and Y for vertical (paddle movement direction)
	// For mobile display: rotate 90 degrees so paddles are top/bottom
	// Host paddle is on left in physics = bottom in display
	// Guest paddle is on right in physics = top in display (from guest view, this becomes bottom)

	const isGuest = $derived(playerRole === 'guest');

	// For display: X (physics) -> Y (screen), Y (physics) -> X (screen)
	// Ball display position (transformed: physics X->Y screen, physics Y->X screen)
	// Then flip for guest so their paddle appears at bottom

	// Display ball position
	const displayBallX = $derived(() => {
		// Physics Y becomes display X
		return isGuest ? ARENA_WIDTH - gameState.ballY : gameState.ballY;
	});
	const displayBallY = $derived(() => {
		// Physics X becomes display Y (inverted so left=bottom, right=top)
		return isGuest ? gameState.ballX : ARENA_WIDTH - gameState.ballX;
	});

	// Local paddle horizontal position (paddle moves horizontally on screen)
	// Guest's view is mirrored, so we invert the paddle position for consistent display
	const localPaddleX = $derived(() => {
		if (isGuest) {
			return ARENA_WIDTH - gameState.paddle2Y; // Guest's paddle, mirrored to match ball display
		}
		return gameState.paddle1Y; // Host's paddle
	});

	// Opponent paddle horizontal position
	const opponentPaddleX = $derived(() => {
		if (isGuest) {
			return ARENA_WIDTH - gameState.paddle1Y; // Host's paddle, flipped
		}
		return ARENA_WIDTH - gameState.paddle2Y; // Guest's paddle, flipped
	});

	// Touch handling - controls horizontal paddle position
	let isTouching = $state(false);

	function handleTouchStart(e: TouchEvent) {
		e.preventDefault();
		isTouching = true;
		handleTouchMove(e);
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isTouching || !gameContainer) return;
		e.preventDefault();

		const touch = e.touches[0];
		const rect = gameContainer.getBoundingClientRect();

		// Touch X position maps to paddle Y in physics (horizontal movement on screen)
		const relativeX = (touch.clientX - rect.left) / rect.width;
		let paddleY = relativeX * ARENA_WIDTH;

		// For guest, invert the paddle position because their display is mirrored
		// This ensures their paddle moves correctly in physics coordinates
		if (isGuest) {
			paddleY = ARENA_WIDTH - paddleY;
		}

		// Clamp to valid paddle range
		const minY = PADDLE_HEIGHT / 2;
		const maxY = ARENA_HEIGHT - PADDLE_HEIGHT / 2;
		paddleY = Math.max(minY, Math.min(maxY, paddleY));

		onPaddleMove(paddleY);
	}

	function handleTouchEnd() {
		isTouching = false;
	}
</script>

<div
	class="game-scene"
	bind:this={gameContainer}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="application"
	aria-label="Pong game"
>
	<!-- Score display -->
	<div class="score-display">
		<div class="score opponent-score">
			<span class="score-label">{opponent}</span>
			<span class="score-value">{opponentScore}</span>
		</div>
		<div class="divider">-</div>
		<div class="score local-score">
			<span class="score-value">{localScore}</span>
			<span class="score-label">YOU</span>
		</div>
	</div>

	<!-- Game arena -->
	<div class="arena">
		<!-- Center line -->
		<div class="center-line"></div>

		<!-- Opponent paddle (top) - horizontal paddle -->
		<div
			class="paddle opponent-paddle"
			style="
				left: {opponentPaddleX() - PADDLE_HEIGHT / 2}%;
				top: {PADDLE_MARGIN}%;
				width: {PADDLE_HEIGHT}%;
				height: {PADDLE_WIDTH}%;
			"
		></div>

		<!-- Local paddle (bottom) - horizontal paddle -->
		<div
			class="paddle local-paddle"
			style="
				left: {localPaddleX() - PADDLE_HEIGHT / 2}%;
				bottom: {PADDLE_MARGIN}%;
				width: {PADDLE_HEIGHT}%;
				height: {PADDLE_WIDTH}%;
			"
		></div>

		<!-- Ball -->
		{#if gameState.status === 'playing'}
			<div
				class="ball"
				style="
					left: {displayBallX() - BALL_RADIUS}%;
					top: {displayBallY() - BALL_RADIUS}%;
					width: {BALL_RADIUS * 2}%;
					height: {BALL_RADIUS * 2}%;
				"
			></div>
		{/if}

		<!-- Countdown overlay -->
		{#if gameState.status === 'countdown' || countdown > 0}
			<div class="countdown-overlay">
				<span class="countdown-number">{countdown || gameState.countdown}</span>
			</div>
		{/if}

		<!-- Touch indicator zone -->
		<div class="touch-zone"></div>
	</div>

	<!-- Touch zone hint -->
	<div class="touch-hint">
		<p>Drag to move your paddle</p>
	</div>
</div>

<style>
	.game-scene {
		display: flex;
		flex-direction: column;
		height: 100%;
		touch-action: none;
		user-select: none;
	}

	.score-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		padding: var(--space-md);
		background: rgba(0, 0, 0, 0.5);
	}

	.score {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.opponent-score {
		flex-direction: column;
	}

	.local-score {
		flex-direction: column-reverse;
	}

	.score-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.score-value {
		font-size: var(--text-2xl);
		font-weight: bold;
		color: var(--color-text);
	}

	.divider {
		font-size: var(--text-xl);
		color: var(--color-text-muted);
	}

	.arena {
		flex: 1;
		position: relative;
		background: var(--color-surface);
		overflow: hidden;
	}

	.center-line {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		background: var(--color-text-muted);
		opacity: 0.3;
	}

	.center-line::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -10px;
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-text-muted);
		border-radius: 50%;
		transform: translateX(-50%);
		opacity: 0.3;
	}

	.paddle {
		position: absolute;
		background: var(--color-text);
		border-radius: var(--radius-sm);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
		transition: box-shadow 0.1s;
	}

	.local-paddle {
		background: var(--color-primary);
		box-shadow: 0 0 15px var(--color-primary);
	}

	.ball {
		position: absolute;
		background: var(--color-text);
		border-radius: 50%;
		box-shadow:
			0 0 10px var(--color-text),
			0 0 20px var(--color-primary);
	}

	.countdown-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
	}

	.countdown-number {
		font-size: calc(var(--gu) * 20);
		font-weight: bold;
		color: var(--color-primary);
		text-shadow: 0 0 30px var(--color-primary);
		animation: pulse 1s ease-in-out infinite;
	}

	.touch-zone {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 30%;
		background: transparent;
	}

	.touch-hint {
		padding: var(--space-sm);
		text-align: center;
		background: rgba(0, 0, 0, 0.5);
	}

	.touch-hint p {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}
</style>
