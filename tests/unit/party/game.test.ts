import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createGameServerState,
	addPlayer,
	removePlayer,
	updatePaddlePosition,
	startCountdown,
	startGame,
	tick,
	handleScoring,
	type GameServerState
} from '$party/gameLogic';
import { WINNING_SCORE, COUNTDOWN_SECONDS } from '$game/constants';

describe('Game Server Logic', () => {
	let state: GameServerState;

	beforeEach(() => {
		state = createGameServerState('test-room-123');
	});

	describe('createGameServerState', () => {
		it('should create initial state with room ID', () => {
			const newState = createGameServerState('my-room');
			expect(newState.roomId).toBe('my-room');
			expect(newState.players).toHaveLength(0);
			expect(newState.gameState.status).toBe('waiting');
		});
	});

	describe('addPlayer', () => {
		it('should add first player as host', () => {
			const result = addPlayer(state, 'conn-1', 'Player1');

			expect(result.players).toHaveLength(1);
			expect(result.players[0].role).toBe('host');
			expect(result.players[0].username).toBe('Player1');
		});

		it('should add second player as guest', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');

			expect(currentState.players).toHaveLength(2);
			expect(currentState.players[1].role).toBe('guest');
		});

		it('should not add more than 2 players', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = addPlayer(currentState, 'conn-3', 'Player3');

			expect(currentState.players).toHaveLength(2);
		});
	});

	describe('removePlayer', () => {
		it('should remove player by connection ID', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = removePlayer(currentState, 'conn-1');

			expect(currentState.players).toHaveLength(1);
			expect(currentState.players[0].id).toBe('conn-2');
		});

		it('should set game status to finished when player leaves during game', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = { ...currentState, gameState: { ...currentState.gameState, status: 'playing' } };
			currentState = removePlayer(currentState, 'conn-1');

			expect(currentState.gameState.status).toBe('finished');
		});
	});

	describe('updatePaddlePosition', () => {
		it('should update host paddle (paddle1) position', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = updatePaddlePosition(currentState, 'conn-1', 30);

			expect(currentState.gameState.paddle1Y).toBe(30);
		});

		it('should update guest paddle (paddle2) position', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = updatePaddlePosition(currentState, 'conn-2', 70);

			expect(currentState.gameState.paddle2Y).toBe(70);
		});

		it('should clamp paddle position to valid range', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');

			currentState = updatePaddlePosition(currentState, 'conn-1', -10);
			expect(currentState.gameState.paddle1Y).toBeGreaterThan(0);

			currentState = updatePaddlePosition(currentState, 'conn-1', 110);
			expect(currentState.gameState.paddle1Y).toBeLessThan(100);
		});
	});

	describe('startCountdown', () => {
		it('should set status to countdown', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = startCountdown(currentState);

			expect(currentState.gameState.status).toBe('countdown');
			expect(currentState.gameState.countdown).toBe(COUNTDOWN_SECONDS);
		});

		it('should not start countdown with only 1 player', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = startCountdown(currentState);

			expect(currentState.gameState.status).toBe('waiting');
		});
	});

	describe('startGame', () => {
		it('should set status to playing and start ball', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = startGame(currentState);

			expect(currentState.gameState.status).toBe('playing');
			// Ball should have velocity
			expect(
				currentState.gameState.ballVelX !== 0 || currentState.gameState.ballVelY !== 0
			).toBe(true);
		});
	});

	describe('tick', () => {
		it('should update ball position when playing', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = startGame(currentState);

			const initialX = currentState.gameState.ballX;
			currentState = tick(currentState);

			// Ball position should change
			expect(currentState.gameState.ballX).not.toBe(initialX);
		});

		it('should not update when not playing', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			const initialX = currentState.gameState.ballX;
			currentState = tick(currentState);

			expect(currentState.gameState.ballX).toBe(initialX);
		});

		it('should decrement countdown', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = startCountdown(currentState);

			const initialCountdown = currentState.gameState.countdown;
			// Simulate 60 ticks (1 second at 60fps)
			for (let i = 0; i < 60; i++) {
				currentState = tick(currentState);
			}

			expect(currentState.gameState.countdown).toBeLessThan(initialCountdown);
		});
	});

	describe('handleScoring', () => {
		it('should increment player1 score', () => {
			let currentState = handleScoring(state, 'player1');
			expect(currentState.gameState.score1).toBe(1);
		});

		it('should increment player2 score', () => {
			let currentState = handleScoring(state, 'player2');
			expect(currentState.gameState.score2).toBe(1);
		});

		it('should set winner when reaching winning score', () => {
			let currentState = state;
			// Set score to one below winning
			currentState = {
				...currentState,
				gameState: { ...currentState.gameState, score1: WINNING_SCORE - 1 }
			};
			currentState = handleScoring(currentState, 'player1');

			expect(currentState.gameState.winner).toBe('player1');
			expect(currentState.gameState.status).toBe('finished');
		});

		it('should reset ball position after scoring', () => {
			let currentState = addPlayer(state, 'conn-1', 'Player1');
			currentState = addPlayer(currentState, 'conn-2', 'Player2');
			currentState = startGame(currentState);

			// Move ball away from center
			currentState = {
				...currentState,
				gameState: { ...currentState.gameState, ballX: 10, ballY: 80 }
			};

			currentState = handleScoring(currentState, 'player1');

			expect(currentState.gameState.ballX).toBe(50);
			expect(currentState.gameState.ballY).toBe(50);
		});
	});
});
