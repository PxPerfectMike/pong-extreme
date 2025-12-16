import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createSceneStore,
	type SceneDefinition,
	type SceneTransition
} from '$engine/scenes/sceneStore';

// Mock scene components (just need to be truthy for testing)
const MockMenuScene = { name: 'MenuScene' };
const MockGameScene = { name: 'GameScene' };
const MockSettingsScene = { name: 'SettingsScene' };

describe('sceneStore', () => {
	const scenes: SceneDefinition[] = [
		{ id: 'menu', component: MockMenuScene },
		{ id: 'game', component: MockGameScene },
		{ id: 'settings', component: MockSettingsScene }
	];

	describe('createSceneStore', () => {
		it('should create a store with initial scene', () => {
			const store = createSceneStore(scenes, 'menu');
			const state = store.getState();

			expect(state.currentScene).toBe('menu');
			expect(state.previousScene).toBeNull();
			expect(state.isTransitioning).toBe(false);
		});

		it('should throw if initial scene is not found', () => {
			expect(() => createSceneStore(scenes, 'nonexistent')).toThrow();
		});

		it('should throw if scenes array is empty', () => {
			expect(() => createSceneStore([], 'menu')).toThrow();
		});
	});

	describe('goto', () => {
		it('should transition to a new scene', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.goto('game');
			const state = store.getState();

			expect(state.currentScene).toBe('game');
			expect(state.previousScene).toBe('menu');
		});

		it('should throw if target scene does not exist', async () => {
			const store = createSceneStore(scenes, 'menu');

			await expect(store.goto('nonexistent')).rejects.toThrow();
		});

		it('should not transition if already on target scene', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.goto('menu');
			const state = store.getState();

			expect(state.currentScene).toBe('menu');
			expect(state.previousScene).toBeNull();
		});

		it('should call onExit hook of current scene', async () => {
			const onExit = vi.fn();
			const scenesWithHooks: SceneDefinition[] = [
				{ id: 'menu', component: MockMenuScene, onExit },
				{ id: 'game', component: MockGameScene }
			];

			const store = createSceneStore(scenesWithHooks, 'menu');
			await store.goto('game');

			expect(onExit).toHaveBeenCalledOnce();
		});

		it('should call onEnter hook of new scene', async () => {
			const onEnter = vi.fn();
			const scenesWithHooks: SceneDefinition[] = [
				{ id: 'menu', component: MockMenuScene },
				{ id: 'game', component: MockGameScene, onEnter }
			];

			const store = createSceneStore(scenesWithHooks, 'menu');
			await store.goto('game');

			expect(onEnter).toHaveBeenCalledOnce();
		});

		it('should wait for async hooks to complete', async () => {
			const order: string[] = [];
			const onExit = vi.fn(async () => {
				await new Promise((r) => setTimeout(r, 10));
				order.push('exit');
			});
			const onEnter = vi.fn(async () => {
				await new Promise((r) => setTimeout(r, 10));
				order.push('enter');
			});

			const scenesWithHooks: SceneDefinition[] = [
				{ id: 'menu', component: MockMenuScene, onExit },
				{ id: 'game', component: MockGameScene, onEnter }
			];

			const store = createSceneStore(scenesWithHooks, 'menu');
			await store.goto('game');

			expect(order).toEqual(['exit', 'enter']);
		});

		it('should support custom transition options', async () => {
			const store = createSceneStore(scenes, 'menu');
			const transition: SceneTransition = { type: 'slide', duration: 500 };

			await store.goto('game', transition);
			const state = store.getState();

			expect(state.currentScene).toBe('game');
		});
	});

	describe('push / pop (scene stack)', () => {
		it('should push scene onto stack', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.push('settings');
			const state = store.getState();

			expect(state.currentScene).toBe('settings');
			expect(store.canGoBack()).toBe(true);
		});

		it('should pop scene from stack and return to previous', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.push('settings');
			await store.pop();
			const state = store.getState();

			expect(state.currentScene).toBe('menu');
			expect(store.canGoBack()).toBe(false);
		});

		it('should handle multiple pushes and pops', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.push('game');
			await store.push('settings');

			expect(store.getState().currentScene).toBe('settings');
			expect(store.getStackDepth()).toBe(2);

			await store.pop();
			expect(store.getState().currentScene).toBe('game');

			await store.pop();
			expect(store.getState().currentScene).toBe('menu');
			expect(store.getStackDepth()).toBe(0);
		});

		it('should not pop if stack is empty', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.pop(); // Should do nothing
			const state = store.getState();

			expect(state.currentScene).toBe('menu');
		});

		it('should clear stack when using goto', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.push('game');
			await store.push('settings');
			await store.goto('menu');

			expect(store.getStackDepth()).toBe(0);
			expect(store.canGoBack()).toBe(false);
		});
	});

	describe('getCurrentSceneComponent', () => {
		it('should return current scene component', () => {
			const store = createSceneStore(scenes, 'menu');

			expect(store.getCurrentSceneComponent()).toBe(MockMenuScene);
		});

		it('should update after scene change', async () => {
			const store = createSceneStore(scenes, 'menu');

			await store.goto('game');

			expect(store.getCurrentSceneComponent()).toBe(MockGameScene);
		});
	});

	describe('subscribe', () => {
		it('should notify subscribers on scene change', async () => {
			const store = createSceneStore(scenes, 'menu');
			const callback = vi.fn();

			store.subscribe(callback);
			await store.goto('game');

			// Called once for initial state, once for transition start, once for transition end
			expect(callback).toHaveBeenCalled();
		});

		it('should return unsubscribe function', () => {
			const store = createSceneStore(scenes, 'menu');
			const callback = vi.fn();

			const unsubscribe = store.subscribe(callback);
			callback.mockClear();

			unsubscribe();
			store.goto('game');

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('transition state', () => {
		it('should set isTransitioning during transition', async () => {
			const store = createSceneStore(scenes, 'menu');
			const states: boolean[] = [];

			store.subscribe((state) => {
				states.push(state.isTransitioning);
			});

			await store.goto('game', { type: 'fade', duration: 0 });

			// Should have been true at some point during transition
			expect(states).toContain(true);
			// Should be false after transition completes
			expect(store.getState().isTransitioning).toBe(false);
		});

		it('should track transition type and progress', async () => {
			const store = createSceneStore(scenes, 'menu');

			const transition: SceneTransition = { type: 'slide', duration: 100 };

			// Start transition but don't await
			const transitionPromise = store.goto('game', transition);

			// Check mid-transition state
			const state = store.getState();
			expect(state.transition).toBeDefined();

			await transitionPromise;
		});
	});

	describe('getSceneById', () => {
		it('should return scene definition by id', () => {
			const store = createSceneStore(scenes, 'menu');

			const scene = store.getSceneById('game');

			expect(scene?.id).toBe('game');
			expect(scene?.component).toBe(MockGameScene);
		});

		it('should return undefined for unknown scene', () => {
			const store = createSceneStore(scenes, 'menu');

			const scene = store.getSceneById('unknown');

			expect(scene).toBeUndefined();
		});
	});
});
