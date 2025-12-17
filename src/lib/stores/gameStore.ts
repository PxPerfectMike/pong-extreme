/**
 * Game Store - Central state management for Pong Extreme
 * Wraps PartySocket connections and provides reactive Svelte stores
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store';
import PartySocket from 'partysocket';
import type {
	GameState,
	PlayerRole,
	ClientMessage,
	ServerMessage,
	MatchmakerClientMessage,
	MatchmakerServerMessage
} from '$game/types';

export type ConnectionState = 'disconnected' | 'connecting' | 'matchmaking' | 'matched' | 'playing';

export interface PongStoreState {
	connectionState: ConnectionState;
	username: string;
	gameState: GameState | null;
	playerRole: PlayerRole | null;
	playerId: string | null;
	opponent: string | null;
	gameRoomId: string | null;
	queuePosition: number;
	totalInQueue: number;
	countdown: number;
	error: string | null;
}

export interface PongStore extends Writable<PongStoreState> {
	// Connection methods
	joinMatchmaking: (host: string) => void;
	leaveMatchmaking: () => void;
	joinGame: (host: string, roomId: string) => void;
	leaveGame: () => void;
	disconnect: () => void;

	// Game actions
	sendPaddlePosition: (y: number) => void;

	// Setters
	setUsername: (username: string) => void;
	clearError: () => void;

	// Getters for transformed coordinates (local player perspective)
	getLocalPaddleY: () => number;
	getOpponentPaddleY: () => number;
	getLocalScore: () => number;
	getOpponentScore: () => number;
	didWin: () => boolean;

	// Derived stores
	isConnected: Readable<boolean>;
	isInQueue: Readable<boolean>;
	isPlaying: Readable<boolean>;
}

const initialState: PongStoreState = {
	connectionState: 'disconnected',
	username: '',
	gameState: null,
	playerRole: null,
	playerId: null,
	opponent: null,
	gameRoomId: null,
	queuePosition: 0,
	totalInQueue: 0,
	countdown: 0,
	error: null
};

export function createPongStore(): PongStore {
	const { subscribe, set, update } = writable<PongStoreState>({ ...initialState });

	let matchmakerSocket: PartySocket | null = null;
	let gameSocket: PartySocket | null = null;

	// Derived stores
	const isConnected = derived({ subscribe }, ($state) =>
		$state.connectionState !== 'disconnected'
	);

	const isInQueue = derived({ subscribe }, ($state) =>
		$state.connectionState === 'matchmaking'
	);

	const isPlaying = derived({ subscribe }, ($state) =>
		$state.connectionState === 'playing' && $state.gameState?.status === 'playing'
	);

	// Matchmaker message handler
	function handleMatchmakerMessage(event: MessageEvent) {
		try {
			const data = JSON.parse(event.data) as MatchmakerServerMessage;

			switch (data.type) {
				case 'QUEUE_JOINED':
					update((s) => ({
						...s,
						connectionState: 'matchmaking',
						queuePosition: data.position
					}));
					break;

				case 'QUEUE_UPDATE':
					update((s) => ({
						...s,
						queuePosition: data.position,
						totalInQueue: data.totalInQueue
					}));
					break;

				case 'MATCH_FOUND':
					update((s) => ({
						...s,
						connectionState: 'matched',
						opponent: data.opponent,
						gameRoomId: data.gameRoomId
					}));
					break;

				case 'USERNAME_TAKEN':
					update((s) => ({
						...s,
						error: `Username "${data.username}" is already taken. Please choose another.`
					}));
					break;

				case 'ERROR':
					update((s) => ({ ...s, error: data.message }));
					break;
			}
		} catch (error) {
			console.error('Error parsing matchmaker message:', error);
		}
	}

	// Game message handler
	function handleGameMessage(event: MessageEvent) {
		try {
			const data = JSON.parse(event.data) as ServerMessage;

			switch (data.type) {
				case 'ASSIGNED_ROLE':
					update((s) => ({
						...s,
						playerRole: data.role,
						playerId: data.playerId
					}));
					break;

				case 'PLAYER_JOINED':
					// Could update UI to show opponent info
					break;

				case 'GAME_STATE':
					update((s) => ({
						...s,
						gameState: data.state,
						connectionState: 'playing'
					}));
					break;

				case 'COUNTDOWN':
					update((s) => ({ ...s, countdown: data.seconds }));
					break;

				case 'GAME_START':
					update((s) => ({
						...s,
						countdown: 0,
						gameState: s.gameState ? { ...s.gameState, status: 'playing' } : null
					}));
					break;

				case 'GAME_OVER':
					update((s) => ({
						...s,
						gameState: s.gameState
							? { ...s.gameState, status: 'finished', winner: data.winner }
							: null
					}));
					break;

				case 'OPPONENT_DISCONNECTED':
					update((s) => ({
						...s,
						error: 'Opponent disconnected. You win!',
						gameState: s.gameState ? { ...s.gameState, status: 'finished' } : null
					}));
					break;

				case 'PLAYER_LEFT':
					// Opponent left
					break;

				case 'ERROR':
					update((s) => ({ ...s, error: data.message }));
					break;
			}
		} catch (error) {
			console.error('Error parsing game message:', error);
		}
	}

	const store: PongStore = {
		subscribe,
		set,
		update,

		joinMatchmaking(host: string) {
			const state = get({ subscribe });

			if (matchmakerSocket) {
				matchmakerSocket.close();
			}

			update((s) => ({ ...s, connectionState: 'connecting', error: null }));

			matchmakerSocket = new PartySocket({
				host,
				room: 'global-matchmaker',
				party: 'matchmaker'
			});

			matchmakerSocket.addEventListener('open', () => {
				// Join queue with username
				const msg: MatchmakerClientMessage = {
					type: 'JOIN_QUEUE',
					username: state.username
				};
				matchmakerSocket?.send(JSON.stringify(msg));
			});

			matchmakerSocket.addEventListener('message', handleMatchmakerMessage);

			matchmakerSocket.addEventListener('close', () => {
				update((s) => {
					if (s.connectionState === 'matchmaking') {
						return { ...s, connectionState: 'disconnected' };
					}
					return s;
				});
			});

			matchmakerSocket.addEventListener('error', () => {
				update((s) => ({
					...s,
					connectionState: 'disconnected',
					error: 'Failed to connect to matchmaking server'
				}));
			});
		},

		leaveMatchmaking() {
			if (matchmakerSocket) {
				const msg: MatchmakerClientMessage = { type: 'LEAVE_QUEUE' };
				matchmakerSocket.send(JSON.stringify(msg));
				matchmakerSocket.close();
				matchmakerSocket = null;
			}
			update((s) => ({
				...s,
				connectionState: 'disconnected',
				queuePosition: 0,
				totalInQueue: 0
			}));
		},

		joinGame(host: string, roomId: string) {
			const state = get({ subscribe });

			// Close matchmaker connection
			if (matchmakerSocket) {
				matchmakerSocket.close();
				matchmakerSocket = null;
			}

			update((s) => ({ ...s, connectionState: 'connecting', gameRoomId: roomId }));

			gameSocket = new PartySocket({
				host,
				room: roomId,
				party: 'game',
				query: { username: state.username }
			});

			gameSocket.addEventListener('message', handleGameMessage);

			gameSocket.addEventListener('close', () => {
				update((s) => ({ ...s, connectionState: 'disconnected' }));
			});

			gameSocket.addEventListener('error', () => {
				update((s) => ({
					...s,
					connectionState: 'disconnected',
					error: 'Failed to connect to game server'
				}));
			});
		},

		leaveGame() {
			if (gameSocket) {
				const msg: ClientMessage = { type: 'LEAVE' };
				gameSocket.send(JSON.stringify(msg));
				gameSocket.close();
				gameSocket = null;
			}
			update((s) => ({
				...s,
				connectionState: 'disconnected',
				gameState: null,
				playerRole: null,
				opponent: null,
				gameRoomId: null
			}));
		},

		disconnect() {
			store.leaveMatchmaking();
			store.leaveGame();
			set({ ...initialState });
		},

		sendPaddlePosition(y: number) {
			if (gameSocket) {
				const msg: ClientMessage = {
					type: 'PADDLE_MOVE',
					y,
					timestamp: Date.now()
				};
				gameSocket.send(JSON.stringify(msg));
			}
		},

		setUsername(username: string) {
			update((s) => ({ ...s, username }));
		},

		clearError() {
			update((s) => ({ ...s, error: null }));
		},

		getLocalPaddleY() {
			const state = get({ subscribe });
			if (!state.gameState) return 50;
			return state.playerRole === 'host'
				? state.gameState.paddle1Y
				: state.gameState.paddle2Y;
		},

		getOpponentPaddleY() {
			const state = get({ subscribe });
			if (!state.gameState) return 50;
			return state.playerRole === 'host'
				? state.gameState.paddle2Y
				: state.gameState.paddle1Y;
		},

		getLocalScore() {
			const state = get({ subscribe });
			if (!state.gameState) return 0;
			return state.playerRole === 'host'
				? state.gameState.score1
				: state.gameState.score2;
		},

		getOpponentScore() {
			const state = get({ subscribe });
			if (!state.gameState) return 0;
			return state.playerRole === 'host'
				? state.gameState.score2
				: state.gameState.score1;
		},

		didWin() {
			const state = get({ subscribe });
			if (!state.gameState?.winner) return false;
			const hostWon = state.gameState.winner === 'player1';
			return state.playerRole === 'host' ? hostWon : !hostWon;
		},

		isConnected,
		isInQueue,
		isPlaying
	};

	return store;
}

// Singleton store instance for the app
export const pongStore = createPongStore();
