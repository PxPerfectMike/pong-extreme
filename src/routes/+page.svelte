<script lang="ts">
	// Entry point - will be wrapped by GameContainer in layout
</script>

<div class="placeholder">
	<h1>SvelteGame Engine</h1>
	<p>Ready to build your game</p>
</div>

<style>
	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		gap: var(--space-md);
	}

	h1 {
		font-size: var(--text-2xl);
		color: var(--color-primary);
	}

	p {
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}
</style>
