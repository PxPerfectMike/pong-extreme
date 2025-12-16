<script lang="ts" module>
	import type { SceneDefinition, SceneTransition, SceneStore } from './sceneStore';

	export type { SceneDefinition, SceneTransition, SceneStore };
</script>

<script lang="ts">
	import { onMount, setContext, getContext } from 'svelte';
	import { createSceneStore, type SceneState } from './sceneStore';
	import { fade } from 'svelte/transition';
	import type { Component } from 'svelte';

	interface Props {
		/** Array of scene definitions */
		scenes: SceneDefinition[];
		/** Initial scene ID */
		initialScene: string;
		/** Default transition for all scene changes */
		defaultTransition?: SceneTransition;
	}

	const SCENE_STORE_KEY = Symbol('scene-store');

	let { scenes, initialScene, defaultTransition = { type: 'fade', duration: 300 } }: Props = $props();

	// Create store once with initial values (captured at component creation)
	// svelte-ignore state_referenced_locally
	const store = createSceneStore(scenes, initialScene);
	setContext(SCENE_STORE_KEY, store);

	let sceneState: SceneState = $state(store.getState());
	let CurrentComponent: Component | null = $state(null);

	onMount(() => {
		CurrentComponent = store.getCurrentSceneComponent() as Component | null;

		return store.subscribe((newState) => {
			sceneState = newState;
			CurrentComponent = store.getCurrentSceneComponent() as Component | null;
		});
	});

	// Get transition props based on type
	function getTransitionProps(transition: SceneTransition | null) {
		if (!transition || transition.type === 'none') {
			return { duration: 0 };
		}

		if (transition.type === 'fade') {
			return { duration: transition.duration };
		}

		if (transition.type === 'slide') {
			const direction = transition.direction || 'left';
			const x = direction === 'left' ? -100 : direction === 'right' ? 100 : 0;
			const y = direction === 'up' ? -100 : direction === 'down' ? 100 : 0;
			return { duration: transition.duration, x, y };
		}

		return { duration: 300 };
	}

	const transitionProps = $derived(getTransitionProps(sceneState.transition || defaultTransition));

	/**
	 * Get the scene store from context.
	 * Must be called from a component inside SceneManager.
	 */
	export function getSceneStore(): SceneStore {
		return getContext(SCENE_STORE_KEY);
	}
</script>

<div class="scene-manager">
	{#key sceneState.currentScene}
		<div
			class="scene"
			in:fade={transitionProps}
			out:fade={{ duration: transitionProps.duration }}
		>
			{#if CurrentComponent}
				<CurrentComponent />
			{/if}
		</div>
	{/key}
</div>

<style>
	.scene-manager {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.scene {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
