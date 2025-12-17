/**
 * Game server logic - pure functions for testing
 * The PartyKit server uses this logic
 */

import type { GameState, PlayerInfo, PlayerRole, Winner } from '$game/types';
import { createInitialGameState } from '$game/types';
import { physicsTick, clampPaddlePosition, resetBall, startBall } from '$game/physics';
import { WINNING_SCORE, COUNTDOWN_SECONDS, GAME_TICK_RATE } from '$game/constants';

export interface GameServerState {
	roomId: string;
	players: PlayerInfo[];
	gameState: GameState;
	tickCount: number;
}

/**
 * Create initial game server state
 */
export function createGameServerState(roomId: string): GameServerState {
	return {
		roomId,
		players: [],
		gameState: createInitialGameState(),
		tickCount: 0
	};
}

/**
 * Add a player to the game
 */
export function addPlayer(state: GameServerState, connectionId: string, username: string): GameServerState {
	// Don't add more than 2 players
	if (state.players.length >= 2) {
		return state;
	}

	const role: PlayerRole = state.players.length === 0 ? 'host' : 'guest';

	const player: PlayerInfo = {
		id: connectionId,
		username,
		role
	};

	return {
		...state,
		players: [...state.players, player]
	};
}

/**
 * Remove a player from the game
 */
export function removePlayer(state: GameServerState, connectionId: string): GameServerState {
	const player = state.players.find((p) => p.id === connectionId);
	if (!player) {
		return state;
	}

	const newPlayers = state.players.filter((p) => p.id !== connectionId);

	// If game was in progress, end it
	let newGameState = state.gameState;
	if (state.gameState.status === 'playing' || state.gameState.status === 'countdown') {
		// Determine winner (the player who stayed)
		const remainingPlayer = newPlayers[0];
		const winner: Winner = remainingPlayer?.role === 'host' ? 'player1' : 'player2';

		newGameState = {
			...state.gameState,
			status: 'finished',
			winner
		};
	}

	return {
		...state,
		players: newPlayers,
		gameState: newGameState
	};
}

/**
 * Get player by connection ID
 */
export function getPlayer(state: GameServerState, connectionId: string): PlayerInfo | undefined {
	return state.players.find((p) => p.id === connectionId);
}

/**
 * Update paddle position for a player
 */
export function updatePaddlePosition(state: GameServerState, connectionId: string, y: number): GameServerState {
	const player = getPlayer(state, connectionId);
	if (!player) {
		return state;
	}

	const clampedY = clampPaddlePosition(y);

	if (player.role === 'host') {
		return {
			...state,
			gameState: {
				...state.gameState,
				paddle1Y: clampedY
			}
		};
	} else {
		return {
			...state,
			gameState: {
				...state.gameState,
				paddle2Y: clampedY
			}
		};
	}
}

/**
 * Start the countdown before game begins
 */
export function startCountdown(state: GameServerState): GameServerState {
	// Need 2 players to start
	if (state.players.length < 2) {
		return state;
	}

	return {
		...state,
		gameState: {
			...state.gameState,
			status: 'countdown',
			countdown: COUNTDOWN_SECONDS
		}
	};
}

/**
 * Start the actual game (after countdown)
 */
export function startGame(state: GameServerState): GameServerState {
	// Randomly choose which player to serve to
	const serveToPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
	const ballState = startBall(serveToPlayer);

	return {
		...state,
		gameState: {
			...state.gameState,
			status: 'playing',
			...ballState,
			countdown: 0
		}
	};
}

/**
 * Run a single game tick
 */
export function tick(state: GameServerState): GameServerState {
	const { gameState } = state;

	// Handle countdown
	if (gameState.status === 'countdown') {
		const newTickCount = state.tickCount + 1;
		const ticksPerSecond = Math.round(1000 / GAME_TICK_RATE);

		// Decrement countdown every second
		let newCountdown = gameState.countdown;
		if (newTickCount % ticksPerSecond === 0) {
			newCountdown = Math.max(0, gameState.countdown - 1);
		}

		// Start game when countdown reaches 0
		if (newCountdown === 0 && gameState.countdown > 0) {
			return startGame({ ...state, tickCount: newTickCount });
		}

		return {
			...state,
			tickCount: newTickCount,
			gameState: {
				...gameState,
				countdown: newCountdown
			}
		};
	}

	// Only run physics when playing
	if (gameState.status !== 'playing') {
		return state;
	}

	// Run physics
	const physicsState = {
		ballX: gameState.ballX,
		ballY: gameState.ballY,
		ballVelX: gameState.ballVelX,
		ballVelY: gameState.ballVelY,
		paddle1Y: gameState.paddle1Y,
		paddle2Y: gameState.paddle2Y
	};

	const { state: newPhysicsState, scored } = physicsTick(physicsState);

	let newState: GameServerState = {
		...state,
		tickCount: state.tickCount + 1,
		gameState: {
			...gameState,
			ballX: newPhysicsState.ballX,
			ballY: newPhysicsState.ballY,
			ballVelX: newPhysicsState.ballVelX,
			ballVelY: newPhysicsState.ballVelY
		}
	};

	// Handle scoring
	if (scored) {
		newState = handleScoring(newState, scored);
	}

	return newState;
}

/**
 * Handle when a player scores
 */
export function handleScoring(state: GameServerState, scorer: 'player1' | 'player2'): GameServerState {
	let { score1, score2 } = state.gameState;

	if (scorer === 'player1') {
		score1++;
	} else {
		score2++;
	}

	// Check for winner
	let winner: Winner = null;
	let status = state.gameState.status;

	if (score1 >= WINNING_SCORE) {
		winner = 'player1';
		status = 'finished';
	} else if (score2 >= WINNING_SCORE) {
		winner = 'player2';
		status = 'finished';
	}

	// Reset ball if game continues
	const ballState = status === 'finished' ? {} : resetBall();

	return {
		...state,
		gameState: {
			...state.gameState,
			score1,
			score2,
			winner,
			status,
			...ballState,
			// After scoring, ball starts towards the scorer
			...(status !== 'finished' ? startBall(scorer) : {})
		}
	};
}

/**
 * Check if game is ready to start (2 players connected)
 */
export function isReadyToStart(state: GameServerState): boolean {
	return state.players.length === 2 && state.gameState.status === 'waiting';
}
