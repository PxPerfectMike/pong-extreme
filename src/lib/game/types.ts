/**
 * Type definitions for Pong Extreme
 */

// Game status enum
export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';

// Player role
export type PlayerRole = 'host' | 'guest';

// Winner type
export type Winner = 'player1' | 'player2' | null;

/**
 * Core game state synchronized between server and clients
 */
export interface GameState {
	// Ball position (0-100 percentage)
	ballX: number;
	ballY: number;
	// Ball velocity
	ballVelX: number;
	ballVelY: number;
	// Paddle positions (Y center, 0-100)
	paddle1Y: number; // Host (top from their view, bottom from server view)
	paddle2Y: number; // Guest (bottom from their view, top from server view)
	// Scores
	score1: number;
	score2: number;
	// Game status
	status: GameStatus;
	winner: Winner;
	// Countdown (seconds remaining, 0 when not in countdown)
	countdown: number;
}

/**
 * Player information
 */
export interface PlayerInfo {
	id: string;
	username: string;
	role: PlayerRole;
}

/**
 * Paddle movement input from client
 */
export interface PaddleInput {
	type: 'PADDLE_MOVE';
	y: number; // Absolute Y position (0-100)
	timestamp: number;
}

/**
 * Client-to-server messages
 */
export type ClientMessage =
	| PaddleInput
	| { type: 'READY' }
	| { type: 'PAUSE' }
	| { type: 'RESUME' }
	| { type: 'LEAVE' };

/**
 * Server-to-client messages
 */
export type ServerMessage =
	| { type: 'GAME_STATE'; state: GameState }
	| { type: 'PLAYER_JOINED'; player: PlayerInfo }
	| { type: 'PLAYER_LEFT'; playerId: string }
	| { type: 'ASSIGNED_ROLE'; role: PlayerRole; playerId: string }
	| { type: 'COUNTDOWN'; seconds: number }
	| { type: 'GAME_START' }
	| { type: 'GAME_OVER'; winner: Winner; finalScore: [number, number] }
	| { type: 'OPPONENT_DISCONNECTED' }
	| { type: 'ERROR'; message: string };

/**
 * Matchmaker client messages
 */
export type MatchmakerClientMessage =
	| { type: 'JOIN_QUEUE'; username: string }
	| { type: 'LEAVE_QUEUE' };

/**
 * Matchmaker server messages
 */
export type MatchmakerServerMessage =
	| { type: 'QUEUE_JOINED'; position: number }
	| { type: 'QUEUE_UPDATE'; position: number; totalInQueue: number }
	| { type: 'MATCH_FOUND'; gameRoomId: string; opponent: string }
	| { type: 'USERNAME_TAKEN'; username: string }
	| { type: 'ERROR'; message: string };

// ============ Helper functions ============

const VALID_GAME_STATUSES: GameStatus[] = ['waiting', 'countdown', 'playing', 'paused', 'finished'];
const VALID_PLAYER_ROLES: PlayerRole[] = ['host', 'guest'];

/**
 * Creates an initial game state with default values
 */
export function createInitialGameState(): GameState {
	return {
		ballX: 50,
		ballY: 50,
		ballVelX: 0,
		ballVelY: 0,
		paddle1Y: 50,
		paddle2Y: 50,
		score1: 0,
		score2: 0,
		status: 'waiting',
		winner: null,
		countdown: 0
	};
}

/**
 * Creates a PlayerInfo object
 */
export function createInitialPlayerInfo(id: string, username: string, role: PlayerRole): PlayerInfo {
	return { id, username, role };
}

/**
 * Type guard for GameStatus
 */
export function isValidGameStatus(value: unknown): value is GameStatus {
	return typeof value === 'string' && VALID_GAME_STATUSES.includes(value as GameStatus);
}

/**
 * Type guard for PlayerRole
 */
export function isValidPlayerRole(value: unknown): value is PlayerRole {
	return typeof value === 'string' && VALID_PLAYER_ROLES.includes(value as PlayerRole);
}
