/**
 * PartyKit Matchmaker Server
 * Handles player queue and matchmaking
 */

import type * as Party from 'partykit/server';
import {
	createMatchmakerState,
	joinQueue,
	leaveQueue,
	findMatch,
	freeUsername,
	type MatchmakerState
} from '../src/lib/party/matchmakerLogic';
import type { MatchmakerClientMessage, MatchmakerServerMessage } from '../src/lib/game/types';
import { USERNAME_PATTERN } from '../src/lib/game/constants';

export default class MatchmakerServer implements Party.Server {
	state: MatchmakerState;

	constructor(readonly room: Party.Room) {
		this.state = createMatchmakerState();
	}

	onConnect(connection: Party.Connection) {
		// Send current queue status
		this.sendToConnection(connection, {
			type: 'QUEUE_UPDATE',
			position: 0,
			totalInQueue: this.state.queue.length
		});
	}

	onMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message) as MatchmakerClientMessage;

			switch (data.type) {
				case 'JOIN_QUEUE':
					this.handleJoinQueue(sender, data.username);
					break;
				case 'LEAVE_QUEUE':
					this.handleLeaveQueue(sender);
					break;
			}
		} catch (error) {
			console.error('Error processing message:', error);
			this.sendToConnection(sender, {
				type: 'ERROR',
				message: 'Invalid message format'
			});
		}
	}

	onClose(connection: Party.Connection) {
		// Remove player from queue when they disconnect
		this.state = leaveQueue(this.state, connection.id);
		this.broadcastQueueUpdate();
	}

	private handleJoinQueue(sender: Party.Connection, username: string) {
		// Validate username format
		if (!USERNAME_PATTERN.test(username)) {
			this.sendToConnection(sender, {
				type: 'ERROR',
				message: 'Invalid username. Use 3-15 alphanumeric characters or underscores.'
			});
			return;
		}

		const result = joinQueue(this.state, sender.id, username);

		if (!result.success) {
			this.sendToConnection(sender, {
				type: 'USERNAME_TAKEN',
				username
			});
			return;
		}

		this.state = result.state;

		// Confirm join to player
		this.sendToConnection(sender, {
			type: 'QUEUE_JOINED',
			position: result.position!
		});

		// Try to find a match
		this.tryMatch();
	}

	private handleLeaveQueue(sender: Party.Connection) {
		this.state = leaveQueue(this.state, sender.id);
		this.broadcastQueueUpdate();
	}

	private tryMatch() {
		const result = findMatch(this.state);

		if (result.match) {
			this.state = result.state;

			const { player1, player2, gameRoomId } = result.match;

			// Notify both players
			const conn1 = this.room.getConnection(player1.connectionId);
			const conn2 = this.room.getConnection(player2.connectionId);

			if (conn1) {
				this.sendToConnection(conn1, {
					type: 'MATCH_FOUND',
					gameRoomId,
					opponent: player2.username
				});
			}

			if (conn2) {
				this.sendToConnection(conn2, {
					type: 'MATCH_FOUND',
					gameRoomId,
					opponent: player1.username
				});
			}
		}

		this.broadcastQueueUpdate();
	}

	private broadcastQueueUpdate() {
		// Update all waiting players with their position
		this.state.queue.forEach((player, index) => {
			const conn = this.room.getConnection(player.connectionId);
			if (conn) {
				this.sendToConnection(conn, {
					type: 'QUEUE_UPDATE',
					position: index + 1,
					totalInQueue: this.state.queue.length
				});
			}
		});
	}

	private sendToConnection(connection: Party.Connection, message: MatchmakerServerMessage) {
		connection.send(JSON.stringify(message));
	}

	// Called when a game ends to free usernames
	async onRequest(request: Party.Request) {
		if (request.method === 'POST') {
			try {
				const body = await request.json() as { action: string; usernames?: string[] };
				if (body.action === 'freeUsernames' && body.usernames) {
					body.usernames.forEach((username) => {
						this.state = freeUsername(this.state, username);
					});
					return new Response('OK');
				}
			} catch {
				return new Response('Invalid request', { status: 400 });
			}
		}
		return new Response('Not found', { status: 404 });
	}
}
