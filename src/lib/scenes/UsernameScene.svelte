<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { USERNAME_PATTERN, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } from '$game/constants';

	interface Props {
		onFindMatch: (username: string) => void;
		onBack: () => void;
		error?: string | null;
	}

	let { onFindMatch, onBack, error = null }: Props = $props();

	let username = $state('');
	let validationError = $state<string | null>(null);

	const isValid = $derived(() => {
		if (username.length < USERNAME_MIN_LENGTH) {
			return false;
		}
		if (username.length > USERNAME_MAX_LENGTH) {
			return false;
		}
		return USERNAME_PATTERN.test(username);
	});

	function validate(): boolean {
		if (username.length < USERNAME_MIN_LENGTH) {
			validationError = `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
			return false;
		}
		if (username.length > USERNAME_MAX_LENGTH) {
			validationError = `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
			return false;
		}
		if (!USERNAME_PATTERN.test(username)) {
			validationError = 'Only letters, numbers, and underscores allowed';
			return false;
		}
		validationError = null;
		return true;
	}

	function handleSubmit() {
		if (validate()) {
			onFindMatch(username);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && isValid()) {
			handleSubmit();
		}
	}

	function handleInput() {
		// Clear validation error on input
		validationError = null;
	}
</script>

<div class="username-scene">
	<button class="back-button" onclick={onBack} aria-label="Go back">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M19 12H5M12 19l-7-7 7-7" />
		</svg>
	</button>

	<div class="content">
		<h1 class="title">Enter Username</h1>

		<p class="description">
			Choose a unique name to battle your opponents
		</p>

		<div class="input-container">
			<input
				type="text"
				bind:value={username}
				oninput={handleInput}
				onkeydown={handleKeydown}
				placeholder="Your username"
				maxlength={USERNAME_MAX_LENGTH}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
			/>
			<span class="char-count">{username.length}/{USERNAME_MAX_LENGTH}</span>
		</div>

		{#if validationError || error}
			<p class="error">{validationError || error}</p>
		{/if}

		<div class="actions">
			<Button
				variant="primary"
				size="lg"
				fullWidth
				disabled={!isValid()}
				onclick={handleSubmit}
			>
				FIND MATCH
			</Button>
		</div>
	</div>
</div>

<style>
	.username-scene {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: var(--space-md);
	}

	.back-button {
		position: absolute;
		top: var(--space-md);
		left: var(--space-md);
		background: transparent;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
	}

	.back-button:hover {
		background: var(--color-secondary);
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
	}

	.title {
		font-size: var(--text-2xl);
		color: var(--color-text);
		margin-bottom: var(--space-sm);
		text-align: center;
	}

	.description {
		font-size: var(--text-md);
		color: var(--color-text-muted);
		margin-bottom: var(--space-xl);
		text-align: center;
	}

	.input-container {
		position: relative;
		width: 100%;
		max-width: calc(var(--gu) * 60);
		margin-bottom: var(--space-md);
	}

	input {
		width: 100%;
		padding: var(--space-md);
		padding-right: calc(var(--space-md) + 50px);
		font-size: var(--text-lg);
		background: var(--color-secondary);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		color: var(--color-text);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	input:focus {
		border-color: var(--color-primary);
	}

	input::placeholder {
		color: var(--color-text-muted);
	}

	.char-count {
		position: absolute;
		right: var(--space-md);
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.error {
		color: var(--color-primary);
		font-size: var(--text-sm);
		margin-bottom: var(--space-md);
		text-align: center;
	}

	.actions {
		width: 100%;
		max-width: calc(var(--gu) * 60);
	}
</style>
