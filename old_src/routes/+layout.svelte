<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<title>Sakata Sensei</title>
</svelte:head>


{@render children()}
