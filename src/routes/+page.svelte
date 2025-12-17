<script lang="ts">
	import { onMount } from 'svelte';
	import { pongStore } from '$stores/gameStore';
	import TitleScene from '$scenes/TitleScene.svelte';
	import UsernameScene from '$scenes/UsernameScene.svelte';
	import MatchmakingScene from '$scenes/MatchmakingScene.svelte';
	import GameScene from '$scenes/GameScene.svelte';
	import GameOverScene from '$scenes/GameOverScene.svelte';

	// Scene management
	type Scene = 'title' | 'username' | 'matchmaking' | 'game' | 'gameover';
	let currentScene = $state<Scene>('title');

	// Get PartyKit host from environment
	const PARTY_HOST = import.meta.env.VITE_PARTY_HOST || 'localhost:1999';

	// Subscribe to store changes
	let storeState = $state($pongStore);

	$effect(() => {
		const unsubscribe = pongStore.subscribe((state) => {
			storeState = state;

			// Auto-navigate based on connection state
			if (state.connectionState === 'matched' && state.gameRoomId) {
				// Join the game room
				pongStore.joinGame(PARTY_HOST, state.gameRoomId);
			}

			if (state.connectionState === 'playing') {
				currentScene = 'game';
			}

			if (state.gameState?.status === 'finished' && currentScene === 'game') {
				currentScene = 'gameover';
			}
		});

		return unsubscribe;
	});

	// Scene handlers
	function handlePlay() {
		currentScene = 'username';
	}

	function handleBackToTitle() {
		pongStore.disconnect();
		currentScene = 'title';
	}

	function handleFindMatch(username: string) {
		pongStore.setUsername(username);
		pongStore.joinMatchmaking(PARTY_HOST);
		currentScene = 'matchmaking';
	}

	function handleCancelMatchmaking() {
		pongStore.leaveMatchmaking();
		currentScene = 'username';
	}

	function handlePaddleMove(y: number) {
		pongStore.sendPaddlePosition(y);
	}

	function handlePlayAgain() {
		pongStore.leaveGame();
		pongStore.joinMatchmaking(PARTY_HOST);
		currentScene = 'matchmaking';
	}

	function handleMainMenu() {
		pongStore.disconnect();
		currentScene = 'title';
	}
</script>

<svelte:head>
	<title>Pong Extreme</title>
	<meta name="description" content="Mobile multiplayer Pong game" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<div class="app">
	{#if currentScene === 'title'}
		<TitleScene onPlay={handlePlay} />
	{:else if currentScene === 'username'}
		<UsernameScene
			onFindMatch={handleFindMatch}
			onBack={handleBackToTitle}
			error={storeState.error}
		/>
	{:else if currentScene === 'matchmaking'}
		<MatchmakingScene
			username={storeState.username}
			queuePosition={storeState.queuePosition}
			totalInQueue={storeState.totalInQueue}
			onCancel={handleCancelMatchmaking}
		/>
	{:else if currentScene === 'game' && storeState.gameState && storeState.playerRole}
		<GameScene
			gameState={storeState.gameState}
			playerRole={storeState.playerRole}
			localScore={pongStore.getLocalScore()}
			opponentScore={pongStore.getOpponentScore()}
			opponent={storeState.opponent || 'Opponent'}
			countdown={storeState.countdown}
			onPaddleMove={handlePaddleMove}
		/>
	{:else if currentScene === 'gameover'}
		<GameOverScene
			didWin={pongStore.didWin()}
			localScore={pongStore.getLocalScore()}
			opponentScore={pongStore.getOpponentScore()}
			opponent={storeState.opponent || 'Opponent'}
			onPlayAgain={handlePlayAgain}
			onMainMenu={handleMainMenu}
		/>
	{/if}

	<!-- Error toast -->
	{#if storeState.error && currentScene !== 'username'}
		<div class="error-toast">
			<p>{storeState.error}</p>
			<button onclick={() => pongStore.clearError()}>Dismiss</button>
		</div>
	{/if}
</div>

<style>
	.app {
		width: 100%;
		height: 100%;
	}

	.error-toast {
		position: fixed;
		bottom: var(--space-lg);
		left: var(--space-md);
		right: var(--space-md);
		background: var(--color-primary);
		color: var(--color-text);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		z-index: 1000;
		animation: slide-up 0.3s ease-out;
	}

	.error-toast p {
		flex: 1;
		font-size: var(--text-sm);
	}

	.error-toast button {
		background: transparent;
		border: 1px solid var(--color-text);
		color: var(--color-text);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: var(--text-sm);
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
