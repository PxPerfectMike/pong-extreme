/**
 * Matchmaker logic - pure functions for testing
 * The PartyKit server uses this logic
 */

export interface QueuedPlayer {
	connectionId: string;
	username: string;
	joinedAt: number;
}

export interface MatchmakerState {
	queue: QueuedPlayer[];
	activeUsernames: Set<string>;
}

export interface MatchResult {
	player1: QueuedPlayer;
	player2: QueuedPlayer;
	gameRoomId: string;
}

export interface JoinQueueResult {
	success: boolean;
	state: MatchmakerState;
	position?: number;
	error?: 'USERNAME_TAKEN' | 'INVALID_USERNAME';
}

export interface FindMatchResult {
	state: MatchmakerState;
	match: MatchResult | null;
}

/**
 * Create a new empty matchmaker state
 */
export function createMatchmakerState(): MatchmakerState {
	return {
		queue: [],
		activeUsernames: new Set()
	};
}

/**
 * Check if a username is already taken (case-insensitive)
 */
export function isUsernameTaken(state: MatchmakerState, username: string): boolean {
	return state.activeUsernames.has(username.toLowerCase());
}

/**
 * Add a player to the matchmaking queue
 */
export function joinQueue(
	state: MatchmakerState,
	connectionId: string,
	username: string
): JoinQueueResult {
	const normalizedUsername = username.toLowerCase();

	// Check if username is taken
	if (state.activeUsernames.has(normalizedUsername)) {
		return {
			success: false,
			state,
			error: 'USERNAME_TAKEN'
		};
	}

	// Create new player
	const player: QueuedPlayer = {
		connectionId,
		username,
		joinedAt: Date.now()
	};

	// Add to queue and track username
	const newQueue = [...state.queue, player];
	const newUsernames = new Set(state.activeUsernames);
	newUsernames.add(normalizedUsername);

	return {
		success: true,
		state: {
			queue: newQueue,
			activeUsernames: newUsernames
		},
		position: newQueue.length
	};
}

/**
 * Remove a player from the queue by connection ID
 */
export function leaveQueue(state: MatchmakerState, connectionId: string): MatchmakerState {
	const player = state.queue.find((p) => p.connectionId === connectionId);

	if (!player) {
		return state;
	}

	const newQueue = state.queue.filter((p) => p.connectionId !== connectionId);
	const newUsernames = new Set(state.activeUsernames);
	newUsernames.delete(player.username.toLowerCase());

	return {
		queue: newQueue,
		activeUsernames: newUsernames
	};
}

/**
 * Free a username (called when player leaves game)
 */
export function freeUsername(state: MatchmakerState, username: string): MatchmakerState {
	const newUsernames = new Set(state.activeUsernames);
	newUsernames.delete(username.toLowerCase());

	return {
		...state,
		activeUsernames: newUsernames
	};
}

/**
 * Generate a unique game room ID
 */
function generateGameRoomId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `game-${timestamp}-${random}`;
}

/**
 * Try to find a match (pair two players)
 */
export function findMatch(state: MatchmakerState): FindMatchResult {
	// Need at least 2 players
	if (state.queue.length < 2) {
		return {
			state,
			match: null
		};
	}

	// Take first two players (FIFO)
	const [player1, player2, ...remainingQueue] = state.queue;

	const match: MatchResult = {
		player1,
		player2,
		gameRoomId: generateGameRoomId()
	};

	// Remove matched players from queue (but keep usernames active)
	return {
		state: {
			queue: remainingQueue,
			activeUsernames: state.activeUsernames
		},
		match
	};
}

/**
 * Get queue position for a connection
 */
export function getQueuePosition(state: MatchmakerState, connectionId: string): number {
	const index = state.queue.findIndex((p) => p.connectionId === connectionId);
	return index === -1 ? -1 : index + 1;
}
