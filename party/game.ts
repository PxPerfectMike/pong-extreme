/**
 * PartyKit Game Server
 * Handles real-time game state and physics
 */

import type * as Party from 'partykit/server';
import {
	createGameServerState,
	addPlayer,
	removePlayer,
	updatePaddlePosition,
	startCountdown,
	tick,
	isReadyToStart,
	type GameServerState
} from '../src/lib/party/gameLogic';
import type { ClientMessage, ServerMessage, PaddleInput } from '../src/lib/game/types';
import { GAME_TICK_RATE } from '../src/lib/game/constants';

export default class GameServer implements Party.Server {
	state: GameServerState;
	gameLoop: ReturnType<typeof setInterval> | null = null;

	constructor(readonly room: Party.Room) {
		this.state = createGameServerState(room.id);
	}

	onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
		// Get username from query params
		const url = new URL(ctx.request.url);
		const username = url.searchParams.get('username') || `Player${this.state.players.length + 1}`;

		// Add player to game
		this.state = addPlayer(this.state, connection.id, username);

		// Notify this player of their role
		const player = this.state.players.find((p) => p.id === connection.id);
		if (player) {
			this.sendToConnection(connection, {
				type: 'ASSIGNED_ROLE',
				role: player.role,
				playerId: connection.id
			});

			// Notify all players of the new player
			this.broadcast({
				type: 'PLAYER_JOINED',
				player
			});
		}

		// Send current game state
		this.sendToConnection(connection, {
			type: 'GAME_STATE',
			state: this.state.gameState
		});

		// Start countdown if both players connected
		if (isReadyToStart(this.state)) {
			this.startCountdownPhase();
		}
	}

	onMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message) as ClientMessage;

			switch (data.type) {
				case 'PADDLE_MOVE':
					this.handlePaddleMove(sender, data as PaddleInput);
					break;
				case 'READY':
					// Player signals ready (for potential rematch feature)
					break;
				case 'PAUSE':
					this.handlePause();
					break;
				case 'RESUME':
					this.handleResume();
					break;
				case 'LEAVE':
					this.handleLeave(sender);
					break;
			}
		} catch (error) {
			console.error('Error processing message:', error);
		}
	}

	onClose(connection: Party.Connection) {
		const leavingPlayer = this.state.players.find((p) => p.id === connection.id);

		this.state = removePlayer(this.state, connection.id);

		// Notify remaining player
		if (leavingPlayer) {
			this.broadcast({
				type: 'PLAYER_LEFT',
				playerId: connection.id
			});

			// If game was in progress, notify winner
			if (this.state.gameState.status === 'finished') {
				this.broadcast({
					type: 'OPPONENT_DISCONNECTED'
				});
				this.stopGameLoop();
			}
		}
	}

	private handlePaddleMove(sender: Party.Connection, input: PaddleInput) {
		this.state = updatePaddlePosition(this.state, sender.id, input.y);
	}

	private handlePause() {
		if (this.state.gameState.status === 'playing') {
			this.state = {
				...this.state,
				gameState: {
					...this.state.gameState,
					status: 'paused'
				}
			};
			this.stopGameLoop();
			this.broadcastGameState();
		}
	}

	private handleResume() {
		if (this.state.gameState.status === 'paused') {
			this.state = {
				...this.state,
				gameState: {
					...this.state.gameState,
					status: 'playing'
				}
			};
			this.startGameLoop();
			this.broadcastGameState();
		}
	}

	private handleLeave(sender: Party.Connection) {
		// Same as disconnect
		this.onClose(sender);
	}

	private startCountdownPhase() {
		this.state = startCountdown(this.state);
		this.broadcast({
			type: 'COUNTDOWN',
			seconds: this.state.gameState.countdown
		});
		this.startGameLoop();
	}

	private startGameLoop() {
		if (this.gameLoop) {
			return;
		}

		this.gameLoop = setInterval(() => {
			const previousStatus = this.state.gameState.status;
			const previousCountdown = this.state.gameState.countdown;

			this.state = tick(this.state);

			// Check for status changes
			if (previousStatus === 'countdown' && this.state.gameState.status === 'playing') {
				this.broadcast({ type: 'GAME_START' });
			}

			// Check for countdown changes
			if (
				previousStatus === 'countdown' &&
				this.state.gameState.countdown !== previousCountdown
			) {
				this.broadcast({
					type: 'COUNTDOWN',
					seconds: this.state.gameState.countdown
				});
			}

			// Check for game over
			if (this.state.gameState.status === 'finished') {
				this.broadcast({
					type: 'GAME_OVER',
					winner: this.state.gameState.winner,
					finalScore: [this.state.gameState.score1, this.state.gameState.score2]
				});
				this.stopGameLoop();
			}

			// Broadcast game state
			this.broadcastGameState();
		}, GAME_TICK_RATE);
	}

	private stopGameLoop() {
		if (this.gameLoop) {
			clearInterval(this.gameLoop);
			this.gameLoop = null;
		}
	}

	private broadcastGameState() {
		this.broadcast({
			type: 'GAME_STATE',
			state: this.state.gameState
		});
	}

	private broadcast(message: ServerMessage) {
		this.room.broadcast(JSON.stringify(message));
	}

	private sendToConnection(connection: Party.Connection, message: ServerMessage) {
		connection.send(JSON.stringify(message));
	}
}
