<script lang="ts">
	import '../app.css';
	import { GameContainer } from '$engine';

	let { children } = $props();
</script>

<GameContainer>
	{@render children()}
</GameContainer>
