<script lang="ts">
	import '../../../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<title>Sakata Sensei - Recommend by lists</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-[#090311] to-[#141634] text-white bg-fixed">
  {@render children()}
</div>


